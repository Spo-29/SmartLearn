<?php

namespace App\Services\Ai;

use App\Models\Lesson;
use App\Models\LessonAnalysis;
use App\Models\User;
use App\Models\UserGeneratedQuiz;
use App\Models\UserGeneratedQuizOption;
use App\Models\UserGeneratedQuizQuestion;
use App\Models\UserQuizAttempt;
use App\Models\UserQuizAttemptAnswer;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LessonQuizService
{
    private $geminiClient;

    private $analysisService;

    public function __construct(GeminiClient $geminiClient, LessonAnalysisService $analysisService)
    {
        $this->geminiClient = $geminiClient;
        $this->analysisService = $analysisService;
    }

    public function generateForUser(User $user, Lesson $lesson)
    {
        $lesson->loadMissing(['chapter.course']);

        $course = optional($lesson->chapter)->course;

        if (!$course) {
            throw new RuntimeException('Lesson is not attached to a course.');
        }

        $analysis = LessonAnalysis::where('lesson_id', $lesson->id)->first();

        if (!$analysis || $analysis->status !== 'ready') {
            $analysis = $this->analysisService->ensureInitialAnalysis($lesson);
        }

        if (!$analysis || $analysis->status !== 'ready') {
            throw new RuntimeException('Lesson analysis is not ready. Regenerate the analysis and try again.');
        }

        $result = $this->geminiClient->generateJson(
            [
                [
                    'text' => $this->buildQuizPrompt($lesson, $analysis),
                ],
            ],
            $this->quizSystemInstruction(),
            [
                'temperature' => (float) config('services.gemini.quiz_temperature', 0.3),
                'max_output_tokens' => (int) config('services.gemini.quiz_max_output_tokens', 4096),
                'timeout' => (int) config('services.gemini.quiz_timeout_seconds', 90),
            ]
        );

        $quizPayload = $this->normalizeQuizPayload($result['content']);

        if (count($quizPayload['questions']) === 0) {
            throw new RuntimeException('Gemini returned no valid quiz questions.');
        }

        $quiz = DB::transaction(function () use ($user, $lesson, $course, $analysis, $result, $quizPayload) {
            UserGeneratedQuiz::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->where('status', 'ready')
                ->update(['status' => 'archived']);

            $quiz = UserGeneratedQuiz::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
                'lesson_analysis_id' => $analysis->id,
                'title' => $quizPayload['title'],
                'instructions' => $quizPayload['instructions'],
                'status' => 'ready',
                'model_name' => $result['model'],
                'generated_at' => now(),
            ]);

            foreach ($quizPayload['questions'] as $questionIndex => $question) {
                $questionModel = UserGeneratedQuizQuestion::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $question['question_text'],
                    'explanation' => $question['explanation'],
                    'difficulty' => $question['difficulty'],
                    'sort_order' => $questionIndex + 1,
                ]);

                foreach ($question['options'] as $optionIndex => $option) {
                    UserGeneratedQuizOption::create([
                        'question_id' => $questionModel->id,
                        'option_text' => $option['text'],
                        'is_correct' => $option['is_correct'] ? 'yes' : 'no',
                        'sort_order' => $optionIndex + 1,
                    ]);
                }
            }

            return $quiz;
        });

        return $quiz->load([
            'questions.options',
            'attempts' => function ($query) use ($user) {
                $query->where('user_id', $user->id)->orderByDesc('id');
            },
        ]);
    }

    public function getLatestQuizForUser(User $user, Lesson $lesson)
    {
        $quiz = UserGeneratedQuiz::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->where('status', 'ready')
            ->orderByDesc('id')
            ->first();

        if (!$quiz) {
            $quiz = UserGeneratedQuiz::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->orderByDesc('id')
                ->first();
        }

        if (!$quiz) {
            return null;
        }

        return $quiz->load([
            'questions.options',
            'attempts' => function ($query) use ($user) {
                $query->where('user_id', $user->id)->orderByDesc('id');
            },
            'attempts.answers',
        ]);
    }

    public function submitQuizForUser(User $user, UserGeneratedQuiz $quiz, array $answers)
    {
        if ((int) $quiz->user_id !== (int) $user->id) {
            throw new RuntimeException('You are not allowed to submit this quiz.');
        }

        $quiz->loadMissing(['questions.options']);
        $questions = $quiz->questions;

        if ($questions->count() === 0) {
            throw new RuntimeException('Quiz has no questions to submit.');
        }

        $normalizedAnswers = $this->normalizeSubmittedAnswers($answers);

        $attempt = DB::transaction(function () use ($user, $quiz, $questions, $normalizedAnswers) {
            $attempt = UserQuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'course_id' => $quiz->course_id,
                'lesson_id' => $quiz->lesson_id,
                'score_percent' => 0,
                'total_questions' => $questions->count(),
                'correct_answers' => 0,
                'started_at' => now(),
                'submitted_at' => now(),
            ]);

            $correctAnswers = 0;

            foreach ($questions as $question) {
                $selectedOptionId = $normalizedAnswers[$question->id] ?? null;
                $selectedOption = null;

                if ($selectedOptionId) {
                    $selectedOption = $question->options->firstWhere('id', (int) $selectedOptionId);
                }

                $isCorrect = $selectedOption && $selectedOption->is_correct === 'yes';

                if ($isCorrect) {
                    $correctAnswers++;
                }

                UserQuizAttemptAnswer::create([
                    'attempt_id' => $attempt->id,
                    'quiz_question_id' => $question->id,
                    'selected_option_id' => $selectedOption ? $selectedOption->id : null,
                    'is_correct' => $isCorrect ? 'yes' : 'no',
                ]);
            }

            $totalQuestions = $questions->count();
            $scorePercent = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 2) : 0;

            $attempt->score_percent = $scorePercent;
            $attempt->correct_answers = $correctAnswers;
            $attempt->save();

            return $attempt;
        });

        return $attempt->load([
            'answers',
            'answers.quizQuestion.options',
            'answers.selectedOption',
        ]);
    }

    public function toClientPayload(UserGeneratedQuiz $quiz, $includeCorrectOptions = false)
    {
        $quiz->loadMissing([
            'questions.options',
            'attempts' => function ($query) {
                $query->orderByDesc('id');
            },
            'attempts.answers',
        ]);

        $latestAttempt = $quiz->attempts->first();
        $attemptAnswerByQuestionId = [];

        if ($latestAttempt) {
            foreach ($latestAttempt->answers as $answer) {
                $attemptAnswerByQuestionId[(int) $answer->quiz_question_id] = $answer;
            }
        }

        $questions = [];

        foreach ($quiz->questions as $question) {
            $answer = $attemptAnswerByQuestionId[(int) $question->id] ?? null;

            $options = [];
            foreach ($question->options as $option) {
                $item = [
                    'id' => (int) $option->id,
                    'text' => $option->option_text,
                ];

                if ($includeCorrectOptions) {
                    $item['is_correct'] = $option->is_correct === 'yes';
                }

                $options[] = $item;
            }

            $questions[] = [
                'id' => (int) $question->id,
                'question_text' => $question->question_text,
                'explanation' => $question->explanation,
                'difficulty' => $question->difficulty,
                'options' => $options,
                'selected_option_id' => $answer ? (int) ($answer->selected_option_id ?? 0) : null,
                'is_correct' => $answer ? ($answer->is_correct === 'yes') : null,
            ];
        }

        return [
            'id' => (int) $quiz->id,
            'lesson_id' => (int) $quiz->lesson_id,
            'course_id' => (int) $quiz->course_id,
            'title' => $quiz->title,
            'instructions' => $quiz->instructions,
            'status' => $quiz->status,
            'model_name' => $quiz->model_name,
            'generated_at' => optional($quiz->generated_at)->toDateTimeString(),
            'questions' => $questions,
            'latest_attempt' => $latestAttempt ? [
                'id' => (int) $latestAttempt->id,
                'score_percent' => (float) $latestAttempt->score_percent,
                'total_questions' => (int) $latestAttempt->total_questions,
                'correct_answers' => (int) $latestAttempt->correct_answers,
                'submitted_at' => optional($latestAttempt->submitted_at)->toDateTimeString(),
            ] : null,
        ];
    }

    private function buildQuizPrompt(Lesson $lesson, LessonAnalysis $analysis)
    {
        $questionCount = (int) config('services.gemini.quiz_question_count', 5);
        if ($questionCount < 3) {
            $questionCount = 3;
        }

        if ($questionCount > 10) {
            $questionCount = 10;
        }

        $summary = trim((string) ($analysis->summary ?? ''));
        $keyConcepts = is_array($analysis->key_concepts) ? $analysis->key_concepts : [];

        $conceptLines = [];
        foreach ($keyConcepts as $concept) {
            if (is_string($concept) && trim($concept) !== '') {
                $conceptLines[] = trim($concept);
                continue;
            }

            if (!is_array($concept)) {
                continue;
            }

            $title = trim((string) ($concept['title'] ?? ''));
            $explanation = trim((string) ($concept['explanation'] ?? ''));

            if ($title === '' && $explanation === '') {
                continue;
            }

            $conceptLines[] = $title !== '' && $explanation !== ''
                ? ($title . ': ' . $explanation)
                : ($title !== '' ? $title : $explanation);
        }

        $lines = [
            'Create a multiple-choice quiz for this lesson.',
            'Return STRICT JSON only (no markdown, no extra text).',
            'Expected JSON shape:',
            '{',
            '  "title": "quiz title",',
            '  "instructions": "one short instruction",',
            '  "questions": [',
            '    {',
            '      "question": "question text",',
            '      "options": ["option A", "option B", "option C", "option D"],',
            '      "correct_option_index": 0,',
            '      "explanation": "why this answer is correct",',
            '      "difficulty": "easy|medium|hard"',
            '    }',
            '  ]',
            '}',
            '',
            'Rules:',
            '- Create exactly ' . $questionCount . ' questions.',
            '- Each question must have exactly 4 options.',
            '- Exactly one option is correct.',
            '- Keep questions grounded in lesson summary and concepts.',
            '- Include an explanation for each question.',
            '',
            'Lesson title: ' . (string) $lesson->title,
            'Lesson description: ' . (string) ($lesson->description ?? ''),
            'Lesson duration (minutes): ' . (string) ($lesson->duration ?? ''),
            'Lesson summary: ' . $summary,
            'Key concepts: ' . (count($conceptLines) ? implode(' | ', $conceptLines) : 'N/A'),
        ];

        return implode("\n", $lines);
    }

    private function quizSystemInstruction()
    {
        return 'You are an assessment assistant for SmartLearn. Produce pedagogically sound quiz questions and valid JSON only.';
    }

    private function normalizeQuizPayload($payload)
    {
        if (isset($payload['quiz']) && is_array($payload['quiz'])) {
            $payload = $payload['quiz'];
        }

        $title = trim((string) ($payload['title'] ?? 'Lesson Quiz'));
        $instructions = trim((string) ($payload['instructions'] ?? 'Choose the best answer for each question.'));

        $rawQuestions = $payload['questions'] ?? [];
        if (!is_array($rawQuestions)) {
            $rawQuestions = [];
        }

        $normalizedQuestions = [];

        foreach ($rawQuestions as $question) {
            if (!is_array($question)) {
                continue;
            }

            $questionText = trim((string) ($question['question'] ?? $question['question_text'] ?? ''));
            if ($questionText === '') {
                continue;
            }

            $difficulty = strtolower(trim((string) ($question['difficulty'] ?? 'medium')));
            if (!in_array($difficulty, ['easy', 'medium', 'hard'], true)) {
                $difficulty = 'medium';
            }

            $explanation = trim((string) ($question['explanation'] ?? ''));
            $optionsRaw = $question['options'] ?? [];

            if (!is_array($optionsRaw)) {
                continue;
            }

            $normalizedOptions = [];
            $explicitCorrectIndex = null;

            foreach ($optionsRaw as $optionIndex => $option) {
                $text = '';
                $isCorrect = false;

                if (is_string($option)) {
                    $text = trim($option);
                } elseif (is_array($option)) {
                    $text = trim((string) ($option['text'] ?? $option['option'] ?? ''));
                    $isCorrect = (bool) ($option['is_correct'] ?? $option['isCorrect'] ?? false);
                }

                if ($text === '') {
                    continue;
                }

                $normalizedOptions[] = [
                    'text' => $text,
                    'is_correct' => $isCorrect,
                ];

                if ($isCorrect) {
                    $explicitCorrectIndex = count($normalizedOptions) - 1;
                }
            }

            if (count($normalizedOptions) < 2) {
                continue;
            }

            $correctOptionIndex = $question['correct_option_index'] ?? $question['correctOptionIndex'] ?? null;

            if (!is_numeric($correctOptionIndex) && isset($question['correct_answer']) && is_string($question['correct_answer'])) {
                $needle = trim($question['correct_answer']);

                foreach ($normalizedOptions as $index => $option) {
                    if (strcasecmp($option['text'], $needle) === 0) {
                        $correctOptionIndex = $index;
                        break;
                    }
                }
            }

            if (!is_numeric($correctOptionIndex) && $explicitCorrectIndex !== null) {
                $correctOptionIndex = $explicitCorrectIndex;
            }

            if (!is_numeric($correctOptionIndex)) {
                $correctOptionIndex = 0;
            }

            $correctOptionIndex = max(0, min((int) $correctOptionIndex, count($normalizedOptions) - 1));

            foreach ($normalizedOptions as $index => &$option) {
                $option['is_correct'] = $index === $correctOptionIndex;
            }
            unset($option);

            $normalizedQuestions[] = [
                'question_text' => $questionText,
                'difficulty' => $difficulty,
                'explanation' => $explanation !== '' ? $explanation : null,
                'options' => $normalizedOptions,
            ];
        }

        return [
            'title' => $title !== '' ? $title : 'Lesson Quiz',
            'instructions' => $instructions !== '' ? $instructions : 'Choose the best answer for each question.',
            'questions' => $normalizedQuestions,
        ];
    }

    private function normalizeSubmittedAnswers(array $answers)
    {
        $normalized = [];

        if ($this->isAssociativeArray($answers)) {
            foreach ($answers as $questionId => $optionId) {
                if (is_numeric($questionId) && is_numeric($optionId)) {
                    $normalized[(int) $questionId] = (int) $optionId;
                }
            }

            return $normalized;
        }

        foreach ($answers as $item) {
            if (!is_array($item)) {
                continue;
            }

            $questionId = $item['question_id'] ?? null;
            $selectedOptionId = $item['selected_option_id'] ?? null;

            if (is_numeric($questionId) && is_numeric($selectedOptionId)) {
                $normalized[(int) $questionId] = (int) $selectedOptionId;
            }
        }

        return $normalized;
    }

    private function isAssociativeArray(array $array)
    {
        if ($array === []) {
            return false;
        }

        return array_keys($array) !== range(0, count($array) - 1);
    }
}

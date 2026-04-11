<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\UserGeneratedQuiz;
use App\Services\Ai\LessonQuizService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class LessonQuizController extends Controller
{
    private $quizService;

    public function __construct(LessonQuizService $quizService)
    {
        $this->quizService = $quizService;
    }

    public function latestForLesson(Request $request, $courseId, $lessonId)
    {
        $lesson = Lesson::with(['chapter.course'])
            ->where('id', $lessonId)
            ->whereHas('chapter', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->first();

        if (!$lesson) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        $isEnrolled = Enrollment::where('user_id', (int) $request->user()->id)
            ->where('course_id', (int) $courseId)
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        $quiz = $this->quizService->getLatestQuizForUser($request->user(), $lesson);

        return response()->json([
            'status' => 200,
            'data' => $quiz ? $this->quizService->toClientPayload($quiz, false) : null,
        ], 200);
    }

    public function generateForLesson(Request $request, $courseId, $lessonId)
    {
        $lesson = Lesson::with(['chapter.course'])
            ->where('id', $lessonId)
            ->whereHas('chapter', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->first();

        if (!$lesson) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        $isEnrolled = Enrollment::where('user_id', (int) $request->user()->id)
            ->where('course_id', (int) $courseId)
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        try {
            $quiz = $this->quizService->generateForUser($request->user(), $lesson);

            return response()->json([
                'status' => 200,
                'message' => 'Quiz generated successfully.',
                'data' => $this->quizService->toClientPayload($quiz, false),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate quiz.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function submit(Request $request, $quizId)
    {
        $quiz = UserGeneratedQuiz::where('id', $quizId)->first();

        if (!$quiz) {
            return response()->json([
                'status' => 404,
                'message' => 'Quiz not found.',
            ], 404);
        }

        if ((int) $quiz->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to submit this quiz.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'answers' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        try {
            $attempt = $this->quizService->submitQuizForUser($request->user(), $quiz, $request->input('answers', []));
            $freshQuiz = $this->quizService->getLatestQuizForUser($request->user(), $quiz->lesson);

            return response()->json([
                'status' => 200,
                'message' => 'Quiz submitted successfully.',
                'data' => [
                    'attempt' => [
                        'id' => (int) $attempt->id,
                        'score_percent' => (float) $attempt->score_percent,
                        'total_questions' => (int) $attempt->total_questions,
                        'correct_answers' => (int) $attempt->correct_answers,
                        'submitted_at' => optional($attempt->submitted_at)->toDateTimeString(),
                    ],
                    'quiz' => $freshQuiz ? $this->quizService->toClientPayload($freshQuiz, true) : null,
                ],
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to submit quiz.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

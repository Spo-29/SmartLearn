<?php

namespace App\Services\Ai;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAnalysis;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class LessonAnalysisService
{
    private $geminiClient;

    public function __construct(GeminiClient $geminiClient)
    {
        $this->geminiClient = $geminiClient;
    }

    public function ensureInitialAnalysis(Lesson $lesson)
    {
        $existing = LessonAnalysis::where('lesson_id', $lesson->id)->first();

        if ($existing) {
            return $existing;
        }

        try {
            return $this->generateAnalysis($lesson, false);
        } catch (Throwable $e) {
            Log::warning('Initial lesson analysis generation failed.', [
                'lesson_id' => $lesson->id,
                'error' => $e->getMessage(),
            ]);

            return LessonAnalysis::where('lesson_id', $lesson->id)->first();
        }
    }

    public function regenerate(Lesson $lesson)
    {
        return $this->generateAnalysis($lesson, true);
    }

    public function toClientPayload($analysis)
    {
        if (!$analysis) {
            return null;
        }

        return [
            'id' => (int) $analysis->id,
            'lesson_id' => (int) $analysis->lesson_id,
            'course_id' => (int) $analysis->course_id,
            'status' => $analysis->status,
            'version' => (int) $analysis->version,
            'source_type' => $analysis->source_type,
            'model_name' => $analysis->model_name,
            'summary' => $analysis->summary,
            'key_concepts' => $analysis->key_concepts ?? [],
            'error_message' => $analysis->error_message,
            'generated_at' => optional($analysis->generated_at)->toDateTimeString(),
            'updated_at' => optional($analysis->updated_at)->toDateTimeString(),
        ];
    }

    private function generateAnalysis(Lesson $lesson, $incrementVersion)
    {
        $lesson->loadMissing(['chapter.course.outcomes', 'chapter.course.requirements']);

        $course = optional($lesson->chapter)->course;

        if (!$course) {
            throw new RuntimeException('Lesson is not attached to a course.');
        }

        $analysis = LessonAnalysis::firstOrNew(['lesson_id' => $lesson->id]);
        $analysis->course_id = $course->id;

        if (!$analysis->exists) {
            $analysis->version = 1;
        } elseif ($incrementVersion) {
            $analysis->version = max(1, ((int) $analysis->version) + 1);
        }

        $analysis->status = 'pending';
        $analysis->model_name = null;
        $analysis->source_type = 'details-only';
        $analysis->summary = null;
        $analysis->key_concepts = null;
        $analysis->raw_payload = null;
        $analysis->error_message = null;
        $analysis->generated_at = null;
        $analysis->save();

        try {
            $requestParts = $this->buildRequestParts($lesson, $course);

            $result = $this->geminiClient->generateJson(
                $requestParts['parts'],
                $this->systemInstruction(),
                [
                    'temperature' => (float) config('services.gemini.analysis_temperature', 0.2),
                    'max_output_tokens' => (int) config('services.gemini.analysis_max_output_tokens', 3072),
                    'timeout' => (int) config('services.gemini.analysis_timeout_seconds', 90),
                ]
            );

            $normalized = $this->normalizeAnalysisPayload($result['content']);

            if ($normalized['summary'] === '') {
                throw new RuntimeException('Gemini returned an empty lesson summary.');
            }

            $analysis->status = 'ready';
            $analysis->model_name = $result['model'];
            $analysis->source_type = $requestParts['source_type'];
            $analysis->summary = $normalized['summary'];
            $analysis->key_concepts = $normalized['key_concepts'];
            $analysis->raw_payload = json_encode($result['content'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $analysis->error_message = null;
            $analysis->generated_at = now();
            $analysis->save();

            return $analysis;
        } catch (Throwable $e) {
            $analysis->status = 'failed';
            $analysis->error_message = mb_substr($e->getMessage(), 0, 1000);
            $analysis->generated_at = null;
            $analysis->save();

            throw $e;
        }
    }

    private function buildRequestParts(Lesson $lesson, Course $course)
    {
        $parts = [
            [
                'text' => $this->analysisPrompt($lesson, $course),
            ],
        ];

        $sourceType = 'details-only';
        $videoInput = $this->buildVideoInputPart($lesson);

        if (isset($videoInput['part'])) {
            $parts[] = $videoInput['part'];
            $sourceType = 'details-plus-video';
        }

        if (isset($videoInput['note'])) {
            $parts[] = [
                'text' => 'Video note: ' . $videoInput['note'],
            ];
        }

        return [
            'parts' => $parts,
            'source_type' => $sourceType,
        ];
    }

    private function analysisPrompt(Lesson $lesson, Course $course)
    {
        $outcomes = $course->outcomes
            ->pluck('text')
            ->filter()
            ->values()
            ->all();

        $requirements = $course->requirements
            ->pluck('text')
            ->filter()
            ->values()
            ->all();

        $lines = [
            'Analyze this lesson for a student-friendly tutoring view.',
            'Return STRICT JSON only (no markdown, no extra text).',
            'Expected JSON shape:',
            '{',
            '  "summary": "short concept explanation for the lesson",',
            '  "key_concepts": [',
            '    {"title": "concept name", "explanation": "concise explanation"}',
            '  ]',
            '}',
            '',
            'Rules:',
            '- Keep the summary clear and practical for learners.',
            '- Keep 3 to 7 key concepts.',
            '- Each concept explanation should be concise and specific to this lesson.',
            '- If video content is unavailable, rely entirely on textual lesson details.',
            '',
            'Course title: ' . (string) $course->title,
            'Course description: ' . (string) ($course->description ?? ''),
            'Lesson title: ' . (string) $lesson->title,
            'Lesson duration (minutes): ' . (string) ($lesson->duration ?? ''),
            'Lesson description: ' . (string) ($lesson->description ?? ''),
            'Lesson free preview: ' . (string) ($lesson->is_free_preview ?? 'no'),
            'Course outcomes: ' . (count($outcomes) ? implode(' | ', $outcomes) : 'N/A'),
            'Course requirements: ' . (count($requirements) ? implode(' | ', $requirements) : 'N/A'),
        ];

        return implode("\n", $lines);
    }

    private function systemInstruction()
    {
        return 'You are an AI tutor for SmartLearn. Produce accurate, concise, curriculum-aligned lesson explanations. Return valid JSON only.';
    }

    private function buildVideoInputPart(Lesson $lesson)
    {
        $video = trim((string) ($lesson->video ?? ''));

        if ($video === '') {
            return [];
        }

        if (preg_match('/^https?:\/\//i', $video)) {
            if ($this->isPublicHttpUrl($video)) {
                return [
                    'part' => [
                        'fileData' => [
                            'mimeType' => $this->guessMimeTypeFromPath($video),
                            'fileUri' => $video,
                        ],
                    ],
                ];
            }

            return [
                'note' => 'The lesson video URL is local/private and cannot be accessed by Gemini. Use lesson details only.',
            ];
        }

        $relativePath = ltrim($video, '/');
        $fullPath = public_path($relativePath);

        if (!File::exists($fullPath)) {
            return [
                'note' => 'The lesson video file was not found on disk. Use lesson details only.',
            ];
        }

        $maxInlineBytes = (int) config('services.gemini.inline_video_max_bytes', 15728640);
        $fileSize = (int) File::size($fullPath);

        if ($fileSize <= 0) {
            return [
                'note' => 'The lesson video file is empty. Use lesson details only.',
            ];
        }

        if ($fileSize > $maxInlineBytes) {
            return [
                'note' => 'The lesson video is larger than inline size limit. Use lesson details only.',
            ];
        }

        $mimeType = File::mimeType($fullPath) ?: 'video/mp4';
        $contents = File::get($fullPath);

        if (!is_string($contents) || $contents === '') {
            return [
                'note' => 'The lesson video could not be read. Use lesson details only.',
            ];
        }

        return [
            'part' => [
                'inlineData' => [
                    'mimeType' => $mimeType,
                    'data' => base64_encode($contents),
                ],
            ],
        ];
    }

    private function isPublicHttpUrl($url)
    {
        $host = parse_url((string) $url, PHP_URL_HOST);

        if (!$host || !is_string($host)) {
            return false;
        }

        $host = strtolower($host);

        if ($host === 'localhost' || $host === '127.0.0.1' || $host === '0.0.0.0') {
            return false;
        }

        return true;
    }

    private function guessMimeTypeFromPath($path)
    {
        $extension = strtolower(pathinfo((string) $path, PATHINFO_EXTENSION));

        if ($extension === 'mov') {
            return 'video/quicktime';
        }

        if ($extension === 'avi') {
            return 'video/x-msvideo';
        }

        if ($extension === 'mkv') {
            return 'video/x-matroska';
        }

        if ($extension === 'webm') {
            return 'video/webm';
        }

        return 'video/mp4';
    }

    private function normalizeAnalysisPayload($payload)
    {
        $summary = trim((string) ($payload['summary'] ?? $payload['analysis'] ?? ''));

        if ($summary === '' && isset($payload['overview']) && is_string($payload['overview'])) {
            $summary = trim($payload['overview']);
        }

        $rawConcepts = $payload['key_concepts'] ?? $payload['keyConcepts'] ?? [];

        if (!is_array($rawConcepts)) {
            $rawConcepts = [];
        }

        $normalizedConcepts = [];

        foreach ($rawConcepts as $concept) {
            if (is_string($concept)) {
                $title = trim($concept);

                if ($title !== '') {
                    $normalizedConcepts[] = [
                        'title' => $title,
                        'explanation' => null,
                    ];
                }

                continue;
            }

            if (!is_array($concept)) {
                continue;
            }

            $title = trim((string) ($concept['title'] ?? $concept['name'] ?? $concept['concept'] ?? ''));
            $explanation = trim((string) ($concept['explanation'] ?? $concept['description'] ?? $concept['details'] ?? ''));

            if ($title === '' && $explanation !== '') {
                $title = mb_substr($explanation, 0, 60);
            }

            if ($title === '') {
                continue;
            }

            $normalizedConcepts[] = [
                'title' => $title,
                'explanation' => $explanation !== '' ? $explanation : null,
            ];
        }

        return [
            'summary' => $summary,
            'key_concepts' => $normalizedConcepts,
        ];
    }
}

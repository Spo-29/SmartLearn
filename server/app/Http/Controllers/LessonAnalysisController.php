<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Lesson;
use App\Services\Ai\LessonAnalysisService;
use Illuminate\Http\Request;
use Throwable;

class LessonAnalysisController extends Controller
{
    private $analysisService;

    public function __construct(LessonAnalysisService $analysisService)
    {
        $this->analysisService = $analysisService;
    }

    public function showForLearner(Request $request, $courseId, $lessonId)
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

        $analysis = $lesson->analysis;

        if (!$analysis) {
            $analysis = $this->analysisService->ensureInitialAnalysis($lesson);
        }

        return response()->json([
            'status' => 200,
            'data' => $this->analysisService->toClientPayload($analysis),
        ], 200);
    }

    public function showForOwner(Request $request, $lessonId)
    {
        $lesson = Lesson::with(['chapter.course', 'analysis'])
            ->where('id', $lessonId)
            ->first();

        if (!$lesson) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        $course = optional($lesson->chapter)->course;

        if (!$course || (int) $course->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to access this lesson analysis.',
            ], 403);
        }

        return response()->json([
            'status' => 200,
            'data' => $this->analysisService->toClientPayload($lesson->analysis),
        ], 200);
    }

    public function regenerateForOwner(Request $request, $lessonId)
    {
        $lesson = Lesson::with(['chapter.course'])
            ->where('id', $lessonId)
            ->first();

        if (!$lesson) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        $course = optional($lesson->chapter)->course;

        if (!$course || (int) $course->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to regenerate this lesson analysis.',
            ], 403);
        }

        try {
            $analysis = $this->analysisService->regenerate($lesson);

            return response()->json([
                'status' => 200,
                'message' => 'Lesson analysis regenerated successfully.',
                'data' => $this->analysisService->toClientPayload($analysis),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to regenerate lesson analysis.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

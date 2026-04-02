<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LessonController extends Controller
{
    public function store(Request $request, $courseId)
    {
        $course = Course::where('id', $courseId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'chapter_id' => 'required|integer|exists:chapters,id',
            'title' => 'required|string|max:255',
            'status' => 'required|in:0,1',
            'duration' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'video' => 'nullable|string|max:255',
            'is_free_preview' => 'nullable|in:yes,no',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $chapter = Chapter::where('id', $request->input('chapter_id'))
            ->where('course_id', $course->id)
            ->first();

        if (!$chapter) {
            return response()->json([
                'status' => 400,
                'message' => 'Selected chapter is invalid.',
            ], 400);
        }

        $nextSortOrder = (int) Lesson::where('chapter_id', $chapter->id)->max('sort_order') + 1;

        $lesson = Lesson::create([
            'chapter_id' => $chapter->id,
            'title' => $request->input('title'),
            'status' => (int) $request->input('status', 1),
            'duration' => $request->input('duration'),
            'description' => $request->input('description'),
            'video' => $request->input('video'),
            'is_free_preview' => $request->input('is_free_preview', 'no'),
            'sort_order' => $nextSortOrder,
        ]);

        return response()->json([
            'status' => 200,
            'data' => $lesson,
            'message' => 'Lesson added successfully.',
        ], 200);
    }

    public function show(Request $request, $id)
    {
        $lesson = Lesson::with(['chapter.course'])->find($id);

        if (!$lesson) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        $course = $lesson->chapter?->course;

        if (!$course || (int) $course->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to view this lesson.',
            ], 403);
        }

        $chapters = Chapter::where('course_id', $course->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'title']);

        return response()->json([
            'status' => 200,
            'data' => [
                'lesson' => $lesson,
                'chapters' => $chapters,
                'course_id' => $course->id,
            ],
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $lesson = Lesson::with(['chapter.course'])->find($id);

        if (!$lesson) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        $course = $lesson->chapter?->course;

        if (!$course || (int) $course->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to update this lesson.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'chapter_id' => 'required|integer|exists:chapters,id',
            'title' => 'required|string|max:255',
            'status' => 'required|in:0,1',
            'duration' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'video' => 'nullable|string|max:255',
            'is_free_preview' => 'nullable|in:yes,no',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $chapter = Chapter::where('id', $request->input('chapter_id'))
            ->where('course_id', $course->id)
            ->first();

        if (!$chapter) {
            return response()->json([
                'status' => 400,
                'message' => 'Selected chapter is invalid.',
            ], 400);
        }

        if ((int) $lesson->chapter_id !== (int) $chapter->id) {
            $nextSortOrder = (int) Lesson::where('chapter_id', $chapter->id)->max('sort_order') + 1;
            $lesson->sort_order = $nextSortOrder;
        }

        $lesson->chapter_id = $chapter->id;
        $lesson->title = $request->input('title');
        $lesson->status = (int) $request->input('status', $lesson->status);
        $lesson->duration = $request->input('duration');
        $lesson->description = $request->input('description');
        $lesson->video = $request->input('video');
        $lesson->is_free_preview = $request->input('is_free_preview', $lesson->is_free_preview ?? 'no');
        $lesson->save();

        return response()->json([
            'status' => 200,
            'data' => $lesson,
            'message' => 'Lesson updated successfully.',
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $lesson = Lesson::with(['chapter.course'])->find($id);

        if (!$lesson) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        $course = $lesson->chapter?->course;

        if (!$course || (int) $course->user_id !== (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to delete this lesson.',
            ], 403);
        }

        $lesson->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Lesson deleted successfully.',
        ], 200);
    }

    public function sortLessons(Request $request, $courseId, $chapterId)
    {
        $course = Course::where('id', $courseId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $chapter = Chapter::where('id', $chapterId)
            ->where('course_id', $course->id)
            ->first();

        if (!$chapter) {
            return response()->json([
                'status' => 404,
                'message' => 'Chapter not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|distinct|exists:lessons,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $ids = array_map('intval', $request->input('ids', []));
        $count = Lesson::where('chapter_id', $chapter->id)
            ->whereIn('id', $ids)
            ->count();

        if ($count !== count($ids)) {
            return response()->json([
                'status' => 400,
                'message' => 'Invalid lesson order payload.',
            ], 400);
        }

        $allIds = Lesson::where('chapter_id', $chapter->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->toArray();

        $missingIds = array_values(array_diff($allIds, $ids));
        $finalIds = array_merge($ids, $missingIds);

        DB::transaction(function () use ($finalIds, $chapter) {
            foreach ($finalIds as $index => $id) {
                Lesson::where('chapter_id', $chapter->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        $lessons = Lesson::where('chapter_id', $chapter->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 200,
            'message' => 'Order updated successfully.',
            'data' => $lessons,
        ], 200);
    }
}

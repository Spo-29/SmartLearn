<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ChapterController extends Controller
{
    public function index(Request $request, $courseId)
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

        $chapters = Chapter::with(['lessons' => function ($query) {
                $query->orderBy('sort_order')->orderBy('id');
            }])
            ->where('course_id', $course->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $chapters,
        ], 200);
    }

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
            'title' => 'required|string|max:255',
            'status' => 'nullable|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $nextSortOrder = (int) Chapter::where('course_id', $course->id)->max('sort_order') + 1;

        $chapter = Chapter::create([
            'title' => $request->input('title'),
            'course_id' => $course->id,
            'sort_order' => $nextSortOrder,
            'status' => $request->input('status', 1),
        ]);

        return response()->json([
            'status' => 200,
            'data' => $chapter,
            'message' => 'Chapter saved successfully.',
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $chapter = Chapter::find($id);

        if (!$chapter) {
            return response()->json([
                'status' => 404,
                'message' => 'Chapter not found.',
            ], 404);
        }

        $course = Course::where('id', $chapter->course_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to update this chapter.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'status' => 'nullable|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $chapter->title = $request->input('title');
        $chapter->status = $request->input('status', $chapter->status);
        $chapter->save();

        return response()->json([
            'status' => 200,
            'data' => $chapter,
            'message' => 'Chapter updated successfully.',
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $chapter = Chapter::find($id);

        if (!$chapter) {
            return response()->json([
                'status' => 404,
                'message' => 'Chapter not found.',
            ], 404);
        }

        $course = Course::where('id', $chapter->course_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to delete this chapter.',
            ], 403);
        }

        $chapter->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Chapter deleted successfully.',
        ], 200);
    }

    public function sortChapters(Request $request, $courseId)
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
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|distinct|exists:chapters,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $ids = array_map('intval', $request->input('ids', []));
        $count = Chapter::where('course_id', $course->id)
            ->whereIn('id', $ids)
            ->count();

        if ($count !== count($ids)) {
            return response()->json([
                'status' => 400,
                'message' => 'Invalid chapter order payload.',
            ], 400);
        }

        $allIds = Chapter::where('course_id', $course->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->map(function ($id) {
                return (int) $id;
            })
            ->toArray();

        $missingIds = array_values(array_diff($allIds, $ids));
        $finalIds = array_merge($ids, $missingIds);

        DB::transaction(function () use ($finalIds, $course) {
            foreach ($finalIds as $index => $id) {
                Chapter::where('course_id', $course->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        $chapters = Chapter::with(['lessons' => function ($query) {
                $query->orderBy('sort_order')->orderBy('id');
            }])
            ->where('course_id', $course->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 200,
            'message' => 'Order updated successfully.',
            'data' => $chapters,
        ], 200);
    }
}

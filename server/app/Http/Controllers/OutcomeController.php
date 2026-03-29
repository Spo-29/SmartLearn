<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Outcome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OutcomeController extends Controller
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

        $outcomes = Outcome::where('course_id', $course->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $outcomes,
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
            'text' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $nextSortOrder = (int) Outcome::where('course_id', $course->id)->max('sort_order') + 1;

        $outcome = Outcome::create([
            'course_id' => $course->id,
            'text' => $request->input('text'),
            'sort_order' => $nextSortOrder,
        ]);

        return response()->json([
            'status' => 200,
            'data' => $outcome,
            'message' => 'Outcome saved successfully.',
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $outcome = Outcome::find($id);

        if (!$outcome) {
            return response()->json([
                'status' => 404,
                'message' => 'Outcome not found.',
            ], 404);
        }

        $course = Course::where('id', $outcome->course_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to update this outcome.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $outcome->text = $request->input('text');
        $outcome->save();

        return response()->json([
            'status' => 200,
            'data' => $outcome,
            'message' => 'Outcome updated successfully.',
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $outcome = Outcome::find($id);

        if (!$outcome) {
            return response()->json([
                'status' => 404,
                'message' => 'Outcome not found.',
            ], 404);
        }

        $course = Course::where('id', $outcome->course_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to delete this outcome.',
            ], 403);
        }

        $outcome->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Outcome deleted successfully.',
        ], 200);
    }
}

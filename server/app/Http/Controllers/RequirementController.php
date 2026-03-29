<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Requirement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RequirementController extends Controller
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

        $requirements = Requirement::where('course_id', $course->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $requirements,
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

        $nextSortOrder = (int) Requirement::where('course_id', $course->id)->max('sort_order') + 1;

        $requirement = Requirement::create([
            'course_id' => $course->id,
            'text' => $request->input('text'),
            'sort_order' => $nextSortOrder,
        ]);

        return response()->json([
            'status' => 200,
            'data' => $requirement,
            'message' => 'Requirement saved successfully.',
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $requirement = Requirement::find($id);

        if (!$requirement) {
            return response()->json([
                'status' => 404,
                'message' => 'Requirement not found.',
            ], 404);
        }

        $course = Course::where('id', $requirement->course_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to update this requirement.',
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

        $requirement->text = $request->input('text');
        $requirement->save();

        return response()->json([
            'status' => 200,
            'data' => $requirement,
            'message' => 'Requirement updated successfully.',
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $requirement = Requirement::find($id);

        if (!$requirement) {
            return response()->json([
                'status' => 404,
                'message' => 'Requirement not found.',
            ], 404);
        }

        $course = Course::where('id', $requirement->course_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not allowed to delete this requirement.',
            ], 403);
        }

        $requirement->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Requirement deleted successfully.',
        ], 200);
    }
}

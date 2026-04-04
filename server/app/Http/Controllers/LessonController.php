<?php

namespace App\Http\Controllers\Controller\front;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Lesson;

class LessonController extends Controller
{
    /**
     * Create a new lesson
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'chapter_id' => 'required|exists:chapters,id',
            'lesson'     => 'required|min:3'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors()
            ], 400);
        }

        $lesson = new Lesson();
        $lesson->chapter_id = $request->chapter_id;
        $lesson->title = $request->lesson;
        $lesson->sort_order = 1000; // Default high number for new lessons
        $lesson->status = $request->input('status', 1);
        $lesson->save();

        return response()->json([
            'status' => 200,
            'data' => $lesson,
            'message' => 'Lesson created successfully.'
        ], 200);
    }

    /**
     * Update existing lesson
     */
    public function update($id, Request $request)
    {
        $lesson = Lesson::find($id);

        if ($lesson == null) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'chapter_id' => 'required',
            'lesson'     => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors()
            ], 400);
        }

        $lesson->chapter_id = $request->chapter_id;
        $lesson->title = $request->lesson;
        // Logic for boolean to yes/no string
        $lesson->is_free_preview = ($request->free_preview == false) ? 'no' : 'yes';
        $lesson->duration = $request->duration;
        $lesson->description = $request->description;
        $lesson->status = $request->status;
        $lesson->save();

        return response()->json([
            'status' => 200,
            'data' => $lesson,
            'message' => 'Lesson updated successfully.'
        ], 200);
    }

    /**
     * Reorder Lessons (For drag-and-drop sorting)
     */
    public function reorder(Request $request)
    {
        $lessonIds = $request->input('lesson_ids'); // Array of IDs in new order

        if (!empty($lessonIds)) {
            foreach ($lessonIds as $index => $id) {
                Lesson::where('id', $id)->update(['sort_order' => $index]);
            }
        }

        return response()->json([
            'status' => 200,
            'message' => 'Lesson order updated successfully.'
        ], 200);
    }

    /**
     * Delete a lesson
     */
    public function destroy($id)
    {
        $lesson = Lesson::find($id);

        if ($lesson == null) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found'
            ], 404);
        }

        $lesson->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Lesson deleted successfully.'
        ], 200);
    }
}
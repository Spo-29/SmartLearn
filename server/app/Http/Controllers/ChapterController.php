<?php

namespace App\Http\Controllers\Controller\front;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Chapter;

class ChapterController extends Controller
{
    /**
     * Create a new chapter
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'course_id' => 'required|exists:courses,id',
            'chapter'   => 'required|min:3'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors()
            ], 400);
        }

        $chapter = new Chapter();
        $chapter->course_id = $request->course_id;
        $chapter->chapter_name = $request->chapter;
        $chapter->sort_order = 1000; // Default high value
        $chapter->status = 1;
        $chapter->save();

        // Load empty lessons relationship to keep frontend structure consistent
        $chapter->load('lessons');

        return response()->json([
            'status' => 201,
            'data' => $chapter,
            'message' => 'Chapter created successfully.'
        ], 201);
    }

    /**
     * Update an existing chapter
     */
    public function update(Request $request, $id)
    {
        $chapter = Chapter::find($id);

        if (!$chapter) {
            return response()->json([
                'status' => 404,
                'message' => 'Chapter not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'chapter' => 'required|min:3'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors()
            ], 400);
        }

        $chapter->chapter_name = $request->chapter;
        $chapter->save();

        // Reload lessons to ensure the frontend reducer doesn't lose data
        $chapter->load('lessons');

        return response()->json([
            'status' => 200,
            'data' => $chapter,
            'message' => 'Chapter updated successfully.'
        ], 200);
    }

    /**
     * Reorder Chapters
     * Called when you implement drag-and-drop for the Modules themselves
     */
    public function reorder(Request $request)
    {
        $chapterIds = $request->input('chapter_ids');

        if (!empty($chapterIds)) {
            foreach ($chapterIds as $index => $id) {
                Chapter::where('id', $id)->update(['sort_order' => $index]);
            }
        }

        return response()->json([
            'status' => 200,
            'message' => 'Chapter order updated successfully.'
        ], 200);
    }

    /**
     * Delete a chapter and its lessons
     */
    public function destroy($id)
    {
        $chapter = Chapter::find($id);

        if (!$chapter) {
            return response()->json([
                'status' => 404,
                'message' => 'Chapter not found'
            ], 404);
        }

        // Optional: If your DB doesn't have cascade delete, delete lessons manually first
        // $chapter->lessons()->delete();

        $chapter->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Chapter deleted successfully.'
        ], 200);
    }
}
<?php

namespace App\Http\Controllers\front;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ChapterController extends Controller
{
    

 public function index(Request $request) {
    $chapters = Chapter::where('course_id', $request->course_id)
        ->orderBy('sort_order')
        ->get();

    return response()->json([
        'status' => 200,
        'data' => $chapters
    ], 200);
}

    public function store(Request $request) {
    $validator = Validator::make($request->all(), [
        'chapter'   => 'required',
        'course_id' => 'required'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 400,
            'errors' => $validator->errors()
        ], 400);
    }

   $chapter = new Chapter();
$chapter->course_id = $request->course_id;
$chapter->title = $request->chapter;
$chapter->sort_order = 1000;
$chapter->save();

return response()->json([
    'status' => 200,
    'data' => $chapter,
    'message' => 'Chapter added successfully.'
], 200);}


    
   public function update($id, Request $request) {
    $chapter = Chapter::find($id);

    if ($chapter == null) {
        return response()->json([
            'status' => 404,
            'message' => 'Chapter not found'
        ], 404);
    }

    $validator = Validator::make($request->all(), [
        'chapter' => 'required'
    ]);
    if ($validator->fails()) {
    return response()->json([
        'status' => 400,
        'errors' => $validator->errors()
    ], 400);
}

$chapter->title = $request->chapter;
$chapter->save();
$chapter->title = $request->chapter;
$chapter->save();

return response()->json([
    'status' => 200,
    'data' => $chapter,
    'message' => 'chapter updated successfully.'
], 200);
   } 
   public function destroy($id) {
    $chapter = Chapter::find($id);

    if ($chapter == null) {
        return response()->json([
            'status' => 404,
            'message' => 'Chapter not found'
        ], 404);
    }

    $chapter->delete();

    return response()->json([
        'status' => 200,
        'message' => 'Chapter deleted successfully.'
    ], 200);
}
public function sortChapters(Request $request) {
    if (!empty($request->chapters)) {
        foreach ($request->chapters as $key => $chapter) {
            Chapter::where('id', $chapter['id'])->update(['sort_order' => $key]);
        }
    }

    return response()->json([
        'status' => 200,
        'message' => 'Order updated successfully.'
    ], 200);
}



}
<?php

namespace App\Http\Controllers\Controller\front;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LessonController extends Controller

{
    public function store(Request $request) {
    $validator = Validator::make($request->all(), [
        'chapter id'   => 'required',
        'lesson' => 'required'
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
$lesson->sort_order = 1000;
$lesson->status = $request->status;
$lesson->save();

return response()->json([
    'status' => 200,
    'data' => $lesson,
    'message' => 'Lesson updated successfully.'
], 200);}



public function update($id,Request $request) {
    $lesson = Lesson::find($id);

if ($lesson == null) {

return response()->json([

'status' => 404, 
'message' => 'Lesson not found' ],404);


}

$validator = Validator::make($request->all(), [
        'chapter id'   => 'required',
        'lesson' => 'required'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 400,
            'errors' => $validator->errors()
        ], 400);
    }

$lesson->chapter_id = $request->chapter_id;
$lesson->title = $request->lesson;
$lesson->is_free_preview=($request->free_preview==false)?'no':'yes';
$lesson->duration = $request->duration;
$lesson->description = $request->description;
$lesson->status = $request->status;
$lesson->save();

return response()->json([
    'status' => 200,
    'data' => $lesson,
    'message' => 'Lesson added successfully.'
], 200);}


public function destroy($id) {

$lesson = Lesson:: find($id);

if ($lesson == null) {



return response()->json([

'status' => 404,

'message' => 'Lesson not found'

],404);

$lesson->delete();

return response()->json([

'status' => 200,

'message' => 'Lesson deleted successfully.'

],200);

}

}
}
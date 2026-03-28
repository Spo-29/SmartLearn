<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Course;

class CourseController extends Controller
{
    //

    public function index()
    {
        return view('course.index');
    }   

    public function store(Request $request)
    {
       $validator = Validator::make($request->all(), [
            'title' => 'required|min:5',
            'status' => 'nullable|in:0,1'
            
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 400, 'errors' => $validator->errors()], 400);
        }

        $course= new Course();
        $course->title = $request->input('title');
        $course->category_id = $request->input('category_id');
        $course->level_id = $request->input('level_id');
        $course->language_id = $request->input('language_id');
        $course->description = $request->input('description');
        $course->price = $request->input('price');
        $course->cross_price = $request->input('cross_price');
        $course->is_featured = $request->input('is_featured', 'no');
        $course->status = $request->input('status', 1);
        $course->user_id = $request->user()->id;
        $course->save();
        return response()->json([
            'status' => 200,
            'data' => $course,
            'message' => 'Course has been created successfully'
        ],200);
    }
}

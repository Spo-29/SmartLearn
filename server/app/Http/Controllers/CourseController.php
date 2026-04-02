<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use App\Models\Course;
use App\Models\Category;
use App\Models\Level;
use App\Models\Language;
use Intervention\Image\Facades\Image;

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

    public function metadata()
    {
        return response()->json([
            'status' => 200,
            'categories' => Category::where('status', 1)->get(),
            'levels' => Level::where('status', 1)->get(),
            'languages' => Language::where('status', 1)->get(),
        ], 200);
    }

    public function myCourses(Request $request)
    {
        $courses = Course::with(['category', 'level', 'language'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $courses,
        ], 200);
    }

    public function edit(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $course,
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|min:5',
            'category_id' => 'nullable|exists:categories,id',
            'level_id' => 'nullable|exists:levels,id',
            'language_id' => 'nullable|exists:languages,id',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'cross_price' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:0,1',
            'is_featured' => 'nullable|in:yes,no',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 400, 'errors' => $validator->errors()], 400);
        }

        $course->title = $request->input('title');
        $course->category_id = $request->input('category_id');
        $course->level_id = $request->input('level_id');
        $course->language_id = $request->input('language_id');
        $course->description = $request->input('description');
        $course->price = $request->input('price');
        $course->cross_price = $request->input('cross_price');
        $course->is_featured = $request->input('is_featured', $course->is_featured ?? 'no');
        $course->status = $request->input('status', $course->status ?? 1);
        $course->save();

        return response()->json([
            'status' => 200,
            'data' => $course,
            'message' => 'Course updated successfully.',
        ], 200);
    }

    public function saveCourseImage(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $image = $request->file('image');
        $extension = strtolower($image->getClientOriginalExtension());
        $fileName = time() . '_' . uniqid() . '.' . $extension;

        $mainDirectory = public_path('upload/course');
        $smallDirectory = public_path('upload/course/small');

        if (!File::exists($mainDirectory)) {
            File::makeDirectory($mainDirectory, 0755, true);
        }

        if (!File::exists($smallDirectory)) {
            File::makeDirectory($smallDirectory, 0755, true);
        }

        $this->deleteCourseImages($course->image);

        $image->move($mainDirectory, $fileName);

        $smallImagePath = $smallDirectory . DIRECTORY_SEPARATOR . $fileName;
        Image::make($mainDirectory . DIRECTORY_SEPARATOR . $fileName)
            ->fit(480, 270, function ($constraint) {
                $constraint->upsize();
            })
            ->save($smallImagePath, 85);

        $course->image = $fileName;
        $course->save();
        $course->refresh();

        return response()->json([
            'status' => 200,
            'data' => $course,
            'message' => 'Course image uploaded successfully.',
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $course = Course::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $this->deleteCourseImages($course->image);
        $course->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Course deleted successfully.',
        ], 200);
    }

    private function deleteCourseImages($fileName)
    {
        if (!$fileName) {
            return;
        }

        $mainPath = public_path('upload/course/' . $fileName);
        $smallPath = public_path('upload/course/small/' . $fileName);

        if (File::exists($mainPath)) {
            File::delete($mainPath);
        }

        if (File::exists($smallPath)) {
            File::delete($smallPath);
        }
    }
}

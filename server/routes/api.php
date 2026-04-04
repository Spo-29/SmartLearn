<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\OutcomeController;
use App\Http\Controllers\RequirementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// Public routes
Route::get('/categories', function () {
    return response()->json(\App\Models\Category::where('status', 1)->get());
});

Route::get('/languages', function () {
    return response()->json(\App\Models\Language::where('status', 1)->get());
});

Route::get('/levels', function () {
    return response()->json(\App\Models\Level::where('status', 1)->get());
});

Route::get('/courses', function () {
    return response()->json(
        \App\Models\Course::with(['category', 'level', 'language', 'user'])
            ->where('status', 1)
            ->get()
    );
});

Route::get('/courses/featured', function () {
    return response()->json(
        \App\Models\Course::with(['category', 'level', 'language', 'user'])
            ->where('is_featured', 'yes')
            ->where('status', 1)
            ->get()
    );
});

Route::get('/courses/{id}', function ($id) {
    $course = \App\Models\Course::with([
        'category',
        'level',
        'language',
        'user',
        'chapters.lessons',
        'outcomes',
        'requirements',
        'reviews.user'
    ])->findOrFail($id);

    return response()->json($course);
})->whereNumber('id');

// Account routes
Route::post('/register', [AccountController::class, 'register']);
Route::post('/authenticate', [AccountController::class, 'authenticate']);
<<<<<<< HEAD


=======
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('/account/profile', [AccountController::class, 'profile']);
    Route::put('/account/profile', [AccountController::class, 'updateProfile']);
    Route::get('/my-courses', [CourseController::class, 'myCourses']);
>>>>>>> f0f72b295e3aec77a434333b4cab6148d3b5ba2a
    Route::get('/courses/meta', [CourseController::class, 'metadata']);
    Route::get('/courses/{id}/edit', [CourseController::class, 'edit'])->whereNumber('id');
    Route::post('/courses', [CourseController::class, 'store']);
    Route::put('/courses/{id}', [CourseController::class, 'update'])->whereNumber('id');
<<<<<<< HEAD
   

=======
    Route::delete('/courses/{id}', [CourseController::class, 'destroy'])->whereNumber('id');
    Route::post('/courses/{id}/image', [CourseController::class, 'saveCourseImage'])->whereNumber('id');
>>>>>>> f0f72b295e3aec77a434333b4cab6148d3b5ba2a
    Route::get('/courses/{courseId}/outcomes', [OutcomeController::class, 'index'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/outcomes', [OutcomeController::class, 'store'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/outcomes/sort', [OutcomeController::class, 'sortOutcomes'])->whereNumber('courseId');
    Route::put('/outcomes/{id}', [OutcomeController::class, 'update'])->whereNumber('id');
    Route::delete('/outcomes/{id}', [OutcomeController::class, 'destroy'])->whereNumber('id');

    Route::get('/courses/{courseId}/requirements', [RequirementController::class, 'index'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/requirements', [RequirementController::class, 'store'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/requirements/sort', [RequirementController::class, 'sortRequirements'])->whereNumber('courseId');
    Route::put('/requirements/{id}', [RequirementController::class, 'update'])->whereNumber('id');
    Route::delete('/requirements/{id}', [RequirementController::class, 'destroy'])->whereNumber('id');
<<<<<<< HEAD

=======
    Route::get('/courses/{courseId}/chapters', [ChapterController::class, 'index'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/chapters', [ChapterController::class, 'store'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/chapters/sort', [ChapterController::class, 'sortChapters'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/lessons', [LessonController::class, 'store'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/chapters/{chapterId}/lessons/sort', [LessonController::class, 'sortLessons'])->whereNumber('courseId')->whereNumber('chapterId');
    Route::put('/chapters/{id}', [ChapterController::class, 'update'])->whereNumber('id');
    Route::delete('/chapters/{id}', [ChapterController::class, 'destroy'])->whereNumber('id');
    Route::get('/lessons/{id}', [LessonController::class, 'show'])->whereNumber('id');
    Route::put('/lessons/{id}', [LessonController::class, 'update'])->whereNumber('id');
    Route::delete('/lessons/{id}', [LessonController::class, 'destroy'])->whereNumber('id');
});
>>>>>>> f0f72b295e3aec77a434333b4cab6148d3b5ba2a

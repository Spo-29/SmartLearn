<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\OutcomeController;
use App\Http\Controllers\RequirementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

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
    return response()->json(\App\Models\Course::with(['category', 'level', 'language', 'user'])->where('status', 1)->get());
});

Route::get('/courses/featured', function () {
    return response()->json(\App\Models\Course::with(['category', 'level', 'language', 'user'])->where('is_featured', 'yes')->where('status', 1)->get());
});

Route::get('/courses/{id}', function ($id) {
    $course = \App\Models\Course::with(['category', 'level', 'language', 'user', 'chapters.lessons', 'outcomes', 'requirements', 'reviews.user'])->findOrFail($id);
    return response()->json($course);
})->whereNumber('id');

// Account routes
Route::post('/register', [AccountController::class, 'register']);
Route::post('/authenticate', [AccountController::class, 'authenticate']);
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('/courses/meta', [CourseController::class, 'metadata']);
    Route::get('/courses/{id}/edit', [CourseController::class, 'edit'])->whereNumber('id');
    Route::post('/courses',[CourseController::class, 'store']);
    Route::put('/courses/{id}', [CourseController::class, 'update'])->whereNumber('id');
    Route::get('/courses/{courseId}/outcomes', [OutcomeController::class, 'index'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/outcomes', [OutcomeController::class, 'store'])->whereNumber('courseId');
    Route::put('/outcomes/{id}', [OutcomeController::class, 'update'])->whereNumber('id');
    Route::delete('/outcomes/{id}', [OutcomeController::class, 'destroy'])->whereNumber('id');
    Route::get('/courses/{courseId}/requirements', [RequirementController::class, 'index'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/requirements', [RequirementController::class, 'store'])->whereNumber('courseId');
    Route::put('/requirements/{id}', [RequirementController::class, 'update'])->whereNumber('id');
    Route::delete('/requirements/{id}', [RequirementController::class, 'destroy'])->whereNumber('id');
});

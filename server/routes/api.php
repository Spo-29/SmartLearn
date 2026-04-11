<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\LessonAnalysisController;
use App\Http\Controllers\LessonQuizController;
use App\Http\Controllers\OutcomeController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\RequirementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReviewController;
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
Route::post('/reviews', [ReviewController::class, 'store']);
Route::get('/courses/{courseId}/reviews', [ReviewController::class, 'courseReviews']);

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

Route::get('/fetch-featured-courses', [HomeController::class, 'fetchFeaturedCourses']);
Route::get('/fetch-courses', [HomeController::class, 'courses']);
Route::get('/fetch-course/{id}', [HomeController::class, 'course'])->whereNumber('id');
Route::get('/fetch-course/{courseId}/lessons/{lessonId}', [HomeController::class, 'courseLesson'])
    ->whereNumber('courseId')
    ->whereNumber('lessonId');

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

Route::get('/courses/{id}/reviews', [ReviewController::class, 'index'])->whereNumber('id');

// Account routes
Route::post('/register', [AccountController::class, 'register']);
Route::post('/authenticate', [AccountController::class, 'authenticate']);
Route::post('/admin/authenticate', [AdminController::class, 'authenticate']);
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('/account/profile', [AccountController::class, 'profile']);
    Route::put('/account/profile', [AccountController::class, 'updateProfile']);
    Route::get('/courses/{id}/detail', [EnrollmentController::class, 'detail'])->whereNumber('id');
    Route::post('/courses/{id}/enroll', [EnrollmentController::class, 'enroll'])->whereNumber('id');
    Route::post('/courses/{id}/reviews', [ReviewController::class, 'store'])->whereNumber('id');
    Route::get('/my-enrollments', [EnrollmentController::class, 'myEnrollments']);
    Route::get('/my-enrollments/{courseId}', [EnrollmentController::class, 'show'])->whereNumber('courseId');
    Route::get('/dashboard/stats', [CourseController::class, 'dashboardStats']);
    Route::get('/my-courses', [CourseController::class, 'myCourses']);
    Route::get('/courses/meta', [CourseController::class, 'metadata']);
    Route::get('/courses/{id}/edit', [CourseController::class, 'edit'])->whereNumber('id');
    Route::post('/courses',[CourseController::class, 'store']);
    Route::put('/courses/{id}', [CourseController::class, 'update'])->whereNumber('id');
    Route::delete('/courses/{id}', [CourseController::class, 'destroy'])->whereNumber('id');
    Route::post('/courses/{id}/image', [CourseController::class, 'saveCourseImage'])->whereNumber('id');
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
    Route::get('/courses/{courseId}/chapters', [ChapterController::class, 'index'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/chapters', [ChapterController::class, 'store'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/chapters/sort', [ChapterController::class, 'sortChapters'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/lessons', [LessonController::class, 'store'])->whereNumber('courseId');
    Route::post('/courses/{courseId}/chapters/{chapterId}/lessons/sort', [LessonController::class, 'sortLessons'])->whereNumber('courseId')->whereNumber('chapterId');
    Route::put('/chapters/{id}', [ChapterController::class, 'update'])->whereNumber('id');
    Route::delete('/chapters/{id}', [ChapterController::class, 'destroy'])->whereNumber('id');
    Route::get('/lessons/{id}', [LessonController::class, 'show'])->whereNumber('id');
    Route::put('/lessons/{id}', [LessonController::class, 'update'])->whereNumber('id');
    Route::post('/lessons/{id}/video', [LessonController::class, 'uploadVideo'])->whereNumber('id');
    Route::delete('/lessons/{id}/video', [LessonController::class, 'deleteVideo'])->whereNumber('id');
    Route::delete('/lessons/{id}', [LessonController::class, 'destroy'])->whereNumber('id');
    Route::get('/lessons/{lessonId}/analysis', [LessonAnalysisController::class, 'showForOwner'])->whereNumber('lessonId');
    Route::post('/lessons/{lessonId}/analysis/regenerate', [LessonAnalysisController::class, 'regenerateForOwner'])->whereNumber('lessonId');
    Route::get('/courses/{courseId}/lessons/{lessonId}/analysis', [LessonAnalysisController::class, 'showForLearner'])
        ->whereNumber('courseId')
        ->whereNumber('lessonId');
    Route::get('/courses/{courseId}/lessons/{lessonId}/quizzes/latest', [LessonQuizController::class, 'latestForLesson'])
        ->whereNumber('courseId')
        ->whereNumber('lessonId');
    Route::post('/courses/{courseId}/lessons/{lessonId}/quizzes/generate', [LessonQuizController::class, 'generateForLesson'])
        ->whereNumber('courseId')
        ->whereNumber('lessonId');
    Route::post('/quizzes/{quizId}/submit', [LessonQuizController::class, 'submit'])->whereNumber('quizId');

    Route::group(['middleware' => ['check.admin']], function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/courses', [AdminController::class, 'courses']);
        Route::put('/admin/courses/{id}/status', [AdminController::class, 'updateCourseStatus'])->whereNumber('id');
        Route::delete('/admin/courses/{id}', [AdminController::class, 'destroyCourse'])->whereNumber('id');
    });
});

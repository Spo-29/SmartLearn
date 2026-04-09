<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    public function authenticate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $adminEmail = $this->adminEmail();
        $adminPassword = $this->adminPassword();

        if (strtolower((string) $request->input('email')) !== $adminEmail || (string) $request->input('password') !== $adminPassword) {
            return response()->json([
                'status' => 401,
                'message' => 'Invalid admin credentials.',
            ], 401);
        }

        $adminUser = $this->ensureAdminUser();

        // Keep only one active admin token for predictable session behavior.
        $adminUser->tokens()->delete();
        $token = $adminUser->createToken('admin-token')->plainTextToken;

        return response()->json([
            'status' => 200,
            'token' => $token,
            'id' => $adminUser->id,
            'name' => $adminUser->name,
            'email' => $adminUser->email,
        ], 200);
    }

    public function dashboard()
    {
        $adminEmail = $this->adminEmail();

        $totalUsers = (int) User::whereRaw('LOWER(email) != ?', [$adminEmail])->count();
        $totalCourses = (int) Course::count();
        $totalEnrollments = (int) Enrollment::count();

        $totalSales = (float) Enrollment::query()
            ->join('courses', 'courses.id', '=', 'enrollments.course_id')
            ->sum(DB::raw('COALESCE(courses.price, 0)'));

        $courseSales = $this->buildCourseSales();

        return response()->json([
            'status' => 200,
            'data' => [
                'summary' => [
                    'total_users' => $totalUsers,
                    'total_courses' => $totalCourses,
                    'total_enrollments' => $totalEnrollments,
                    'total_sales' => round($totalSales, 2),
                ],
                'course_sales' => $courseSales,
            ],
        ], 200);
    }

    public function courses()
    {
        return response()->json([
            'status' => 200,
            'data' => $this->buildCourseSales(),
        ], 200);
    }

    public function updateCourseStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $course = Course::with('user:id,name,email')->find($id);

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $course->status = (int) $request->input('status');
        $course->save();

        return response()->json([
            'status' => 200,
            'message' => $course->status === 1 ? 'Course published successfully.' : 'Course unpublished successfully.',
            'data' => [
                'id' => $course->id,
                'status' => (int) $course->status,
            ],
        ], 200);
    }

    public function destroyCourse($id)
    {
        $course = Course::find($id);

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

    private function buildCourseSales()
    {
        return Course::with('user:id,name,email')
            ->withCount('enrollments')
            ->withCount([
                'reviews as reviews_count' => function ($query) {
                    $query->where('status', 1);
                },
            ])
            ->withAvg([
                'reviews as average_rating' => function ($query) {
                    $query->where('status', 1);
                },
            ], 'rating')
            ->orderByDesc('id')
            ->get()
            ->map(function ($course) {
                $price = (float) ($course->price ?? 0);
                $enrollmentsCount = (int) ($course->enrollments_count ?? 0);
                $reviewsCount = (int) ($course->reviews_count ?? 0);
                $averageRating = $course->average_rating !== null ? round((float) $course->average_rating, 1) : 0;

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => (int) $course->status,
                    'price' => round($price, 2),
                    'enrollments_count' => $enrollmentsCount,
                    'reviews_count' => $reviewsCount,
                    'average_rating' => $averageRating,
                    'sales' => round($price * $enrollmentsCount, 2),
                    'creator' => [
                        'id' => $course->user?->id,
                        'name' => $course->user?->name,
                        'email' => $course->user?->email,
                    ],
                ];
            })
            ->values();
    }

    private function ensureAdminUser()
    {
        $adminEmail = $this->adminEmail();
        $adminPassword = $this->adminPassword();

        $user = User::whereRaw('LOWER(email) = ?', [$adminEmail])->first();

        if (!$user) {
            $user = new User();
            $user->name = 'Admin';
            $user->email = $adminEmail;
            $user->email_verified_at = now();
            $user->password = Hash::make($adminPassword);
            $user->save();

            return $user;
        }

        if (!Hash::check($adminPassword, $user->password)) {
            $user->password = Hash::make($adminPassword);
            $user->save();
        }

        return $user;
    }

    private function adminEmail()
    {
        return strtolower((string) env('ADMIN_EMAIL', 'waliza@gmail.com'));
    }

    private function adminPassword()
    {
        return (string) env('ADMIN_PASSWORD', 'waliza123');
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

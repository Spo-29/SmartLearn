<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Review;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function detail(Request $request, $courseId)
    {
        $course = $this->findCourseWithDetails($courseId, true);

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $course = $this->appendUserEnrollmentContext($course, (int) $request->user()->id);

        return response()->json([
            'status' => 200,
            'data' => $course,
        ], 200);
    }

    public function enroll(Request $request, $courseId)
    {
        $userId = (int) $request->user()->id;

        $course = Course::where('id', $courseId)
            ->where('status', 1)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        if ((int) $course->user_id === $userId) {
            return response()->json([
                'status' => 403,
                'message' => 'You cannot enroll to your own created course.',
            ], 403);
        }

        $alreadyEnrolled = Enrollment::where('user_id', $userId)
            ->where('course_id', $course->id)
            ->exists();

        if ($alreadyEnrolled) {
            $detail = $this->appendUserEnrollmentContext(
                $this->findCourseWithDetails($course->id, true),
                $userId,
            );

            return response()->json([
                'status' => 200,
                'message' => 'you have enrolled already',
                'data' => $detail,
            ], 200);
        }

        Enrollment::create([
            'user_id' => $userId,
            'course_id' => $course->id,
        ]);

        $detail = $this->appendUserEnrollmentContext(
            $this->findCourseWithDetails($course->id, true),
            $userId,
        );

        return response()->json([
            'status' => 200,
            'message' => 'Enrolled successfully.',
            'data' => $detail,
        ], 200);
    }

    public function myEnrollments(Request $request)
    {
        $userId = (int) $request->user()->id;

        $courses = Course::with(['category', 'level', 'language', 'user'])
            ->withCount([
                'enrollments as enrollments_count',
                'reviews as reviews_count' => function ($query) {
                    $query->where('status', 1);
                },
            ])
            ->withAvg([
                'reviews as average_rating' => function ($query) {
                    $query->where('status', 1);
                },
            ], 'rating')
            ->whereHas('enrollments', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->orderByDesc('id')
            ->get();

        $courses->each(function ($course) use ($userId) {
            $course->setAttribute('is_enrolled', true);
            $course->setAttribute('is_owner', (int) $course->user_id === $userId);
            $course->setAttribute(
                'average_rating',
                $course->average_rating !== null ? round((float) $course->average_rating, 1) : 0,
            );
            $course->setAttribute('reviews_count', (int) ($course->reviews_count ?? 0));
            $course->setAttribute('enrollments_count', (int) ($course->enrollments_count ?? 0));
        });

        return response()->json([
            'status' => 200,
            'data' => $courses,
        ], 200);
    }

    public function show(Request $request, $courseId)
    {
        $userId = (int) $request->user()->id;

        $enrolled = Enrollment::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->exists();

        if (!$enrolled) {
            return response()->json([
                'status' => 403,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        $course = $this->findCourseWithDetails($courseId, false);

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        if ((int) $course->user_id === $userId) {
            return response()->json([
                'status' => 403,
                'message' => 'You cannot enroll to your own created course.',
            ], 403);
        }

        $course = $this->appendUserEnrollmentContext($course, $userId);

        return response()->json([
            'status' => 200,
            'data' => $course,
        ], 200);
    }

    private function findCourseWithDetails($courseId, $onlyPublished = true)
    {
        $query = Course::with([
            'category',
            'level',
            'language',
            'user',
            'chapters' => function ($query) {
                $query->where('status', 1)->orderBy('sort_order')->orderBy('id');
            },
            'chapters.lessons' => function ($query) {
                $query->where('status', 1)->orderBy('sort_order')->orderBy('id');
            },
            'outcomes' => function ($query) {
                $query->orderBy('sort_order')->orderBy('id');
            },
            'requirements' => function ($query) {
                $query->orderBy('sort_order')->orderBy('id');
            },
            'reviews' => function ($query) {
                $query->where('status', 1)
                    ->with(['user:id,name'])
                    ->orderByDesc('created_at');
            },
        ])
            ->withCount([
                'chapters as chapters_count' => function ($query) {
                    $query->where('status', 1);
                },
                'lessons as lessons_count' => function ($query) {
                    $query->where('lessons.status', 1);
                },
                'enrollments as enrollments_count',
                'reviews as reviews_count' => function ($query) {
                    $query->where('status', 1);
                },
            ])
            ->withSum([
                'lessons as lessons_duration_sum' => function ($query) {
                    $query->where('lessons.status', 1);
                },
            ], 'duration')
            ->withAvg([
                'reviews as average_rating' => function ($query) {
                    $query->where('status', 1);
                },
            ], 'rating')
            ->where('id', $courseId);

        if ($onlyPublished) {
            $query->where('status', 1);
        }

        return $query->first();
    }

    private function appendUserEnrollmentContext($course, $userId)
    {
        if (!$course) {
            return null;
        }

        $isOwner = (int) $course->user_id === (int) $userId;
        $isEnrolled = Enrollment::where('user_id', $userId)
            ->where('course_id', $course->id)
            ->exists();

        $userReview = Review::where('course_id', $course->id)
            ->where('user_id', $userId)
            ->first(['id', 'rating', 'comment', 'status', 'created_at', 'updated_at']);

        $course->setAttribute('is_owner', $isOwner);
        $course->setAttribute('is_enrolled', $isEnrolled);
        $course->setAttribute('user_review', $userReview);
        $course->setAttribute(
            'average_rating',
            $course->average_rating !== null ? round((float) $course->average_rating, 1) : 0,
        );
        $course->setAttribute('reviews_count', (int) ($course->reviews_count ?? 0));
        $course->setAttribute('enrollments_count', (int) ($course->enrollments_count ?? 0));

        return $course;
    }
}

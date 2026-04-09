<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function fetchFeaturedCourses()
    {
        $courses = Course::with('level')
            ->withCount(['enrollments as enrollments_count'])
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
            ->where('is_featured', 'yes')
            ->where('status', 1)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $courses->each(function ($course) {
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

    public function courses(Request $request)
    {
        $query = Course::with(['category', 'level', 'language'])
            ->withCount(['enrollments as enrollments_count'])
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
            ->where('status', 1);

        $keyword = trim((string) $request->query('keyword', ''));
        if ($keyword !== '') {
            $query->where('title', 'like', '%' . $keyword . '%');
        }

        $categoryIds = $this->parseIds($request->query('category'));
        if (!empty($categoryIds)) {
            $query->where('category_id', $categoryIds[0]);
        }

        $levelIds = $this->parseIds($request->query('level'));
        if (!empty($levelIds)) {
            $query->where('level_id', $levelIds[0]);
        }

        $languageIds = $this->parseIds($request->query('language'));
        if (!empty($languageIds)) {
            $query->where('language_id', $languageIds[0]);
        }

        $sortDirection = strtolower((string) $request->query('sort', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy('created_at', $sortDirection)->orderBy('id', $sortDirection);

        $courses = $query->get();

        $courses->each(function ($course) {
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

    public function course($id)
    {
        $course = Course::with([
                'category',
                'level',
                'language',
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
            ->where('status', 1)
            ->find($id);

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $course->setAttribute(
                'average_rating',
                $course->average_rating !== null ? round((float) $course->average_rating, 1) : 0,
            ),
        ], 200);
    }

    public function courseLesson($courseId, $lessonId)
    {
        $lesson = Lesson::with([
                'chapter' => function ($query) {
                    $query->select(['id', 'title', 'course_id', 'status']);
                },
                'chapter.course' => function ($query) {
                    $query->select(['id', 'title', 'status']);
                },
            ])
            ->where('id', $lessonId)
            ->where('status', 1)
            ->whereHas('chapter', function ($query) use ($courseId) {
                $query->where('status', 1)
                    ->where('course_id', $courseId)
                    ->whereHas('course', function ($courseQuery) {
                        $courseQuery->where('status', 1);
                    });
            })
            ->first();

        if (!$lesson || !$lesson->chapter || !$lesson->chapter->course) {
            return response()->json([
                'status' => 404,
                'message' => 'Lesson not found.',
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => [
                'lesson' => $lesson,
                'chapter' => $lesson->chapter,
                'course' => $lesson->chapter->course,
            ],
        ], 200);
    }

    private function parseIds($value)
    {
        if (!is_string($value) || trim($value) === '') {
            return [];
        }

        $ids = array_map('intval', explode(',', $value));
        $ids = array_values(array_filter($ids, function ($id) {
            return $id > 0;
        }));

        return array_values(array_unique($ids));
    }
}

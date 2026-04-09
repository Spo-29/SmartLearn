<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    public function index($courseId)
    {
        $course = Course::where('id', $courseId)->where('status', 1)->first();

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        $reviews = Review::with(['user:id,name'])
            ->where('course_id', $course->id)
            ->where('status', 1)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => [
                'reviews' => $reviews,
                'summary' => $this->reviewSummary($course->id),
            ],
        ], 200);
    }

    public function store(Request $request, $courseId)
    {
        $course = Course::find($courseId);

        if (!$course) {
            return response()->json([
                'status' => 404,
                'message' => 'Course not found.',
            ], 404);
        }

        if ((int) $course->user_id === (int) $request->user()->id) {
            return response()->json([
                'status' => 403,
                'message' => 'You cannot review your own course.',
            ], 403);
        }

        $isEnrolled = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'status' => 403,
                'message' => 'You need to enroll before submitting a review.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $review = Review::firstOrNew([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
        ]);

        $isNew = !$review->exists;

        $comment = trim((string) $request->input('comment', ''));

        $review->rating = (int) $request->input('rating');
        $review->comment = $comment !== '' ? $comment : null;
        $review->status = 1;
        $review->save();

        $review->load(['user:id,name']);

        return response()->json([
            'status' => 200,
            'message' => $isNew ? 'Review submitted successfully.' : 'Review updated successfully.',
            'data' => [
                'review' => $review,
                'summary' => $this->reviewSummary($course->id),
            ],
        ], 200);
    }

    private function reviewSummary($courseId)
    {
        $averageRating = Review::where('course_id', $courseId)
            ->where('status', 1)
            ->avg('rating');

        $reviewsCount = Review::where('course_id', $courseId)
            ->where('status', 1)
            ->count();

        return [
            'average_rating' => $averageRating !== null ? round((float) $averageRating, 1) : 0,
            'reviews_count' => (int) $reviewsCount,
        ];
    }
}

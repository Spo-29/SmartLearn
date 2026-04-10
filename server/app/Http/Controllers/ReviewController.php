<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'comment' => 'required|string',
        ]);

        $review = Review::create([
            'user_id' => auth()->id() ?? 1,
            'course_id' => $request->course_id,
            'comment' => $request->comment,
            'rating' => 5,
        ]);

        return response()->json([
            'status' => 200,
            'message' => 'Comment submitted successfully',
            'review' => $review,
        ]);
    }

    public function courseReviews($courseId)
    {
        $reviews = Review::with('user')
            ->where('course_id', $courseId)
            ->latest()
            ->get();

        return response()->json([
            'status' => 200,
            'reviews' => $reviews,
        ]);
    }
}
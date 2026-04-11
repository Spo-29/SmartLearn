<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        try {
            $request->validate([
                'course_id' => 'required|exists:courses,id',
                'comment' => 'required|string',
                'rating' => 'required|integer|min:1|max:5',
            ]);

            DB::table('reviews')->insert([
                'user_id' => 1,
                'course_id' => $request->course_id,
                'rating' => $request->rating,
                'comment' => $request->comment,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Review submitted successfully',
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 500,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function courseReviews($courseId)
    {
        try {
            $reviews = DB::table('reviews')
                ->leftJoin('users', 'reviews.user_id', '=', 'users.id')
                ->select(
                    'reviews.id',
                    'reviews.user_id',
                    'reviews.course_id',
                    'reviews.rating',
                    'reviews.comment',
                    'reviews.status',
                    'reviews.created_at',
                    'users.name as user_name'
                )
                ->where('reviews.course_id', $courseId)
                ->orderByDesc('reviews.id')
                ->get();

            return response()->json([
                'status' => 200,
                'reviews' => $reviews,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 500,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
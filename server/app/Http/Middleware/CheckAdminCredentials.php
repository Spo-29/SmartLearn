<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAdminCredentials
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $adminEmail = strtolower((string) env('ADMIN_EMAIL', 'waliza@gmail.com'));

        if (strtolower((string) $user->email) !== $adminEmail) {
            return response()->json([
                'status' => 403,
                'message' => 'Access denied. Admin only.',
            ], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;


class AccountController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|min:5',
            'email' => 'required|email|unique:users',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 400, 'errors' => $validator->errors()], 400);
        }

        $user = new User();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['status' => 200, 'message' => 'User registered successfully'], 200);
    }

    public function authenticate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors()
            ], 400);
        }

        $email = strtolower(trim((string) $request->input('email')));
        $this->ensureConfiguredAdminUser($email);

        if (Auth::attempt(['email' => $email, 'password' => $request->password])) {
            $user = User::find(Auth::user()->id);
            $token = $user->createToken('token')->plainTextToken;
            $isAdmin = strtolower((string) $user->email) === strtolower((string) env('ADMIN_EMAIL', 'waliza@gmail.com'));

            return response()->json([
                'status' => 200,
                'token' => $token,
                'name' => $user->name,
                'id' => Auth::user()->id,
                'email' => $user->email,
                'is_admin' => $isAdmin,
            ], 200);
        } else {
            return response()->json([
                'status' => 401,
                'message' => 'Either email/password is incorrect.'
            ], 401);
        }
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $isAdmin = strtolower((string) $user->email) === strtolower((string) env('ADMIN_EMAIL', 'waliza@gmail.com'));

        return response()->json([
            'status' => 200,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $isAdmin,
            ],
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors(),
            ], 400);
        }

        $user->name = $request->input('name');
        $user->email = $request->input('email');
        $user->save();

        return response()->json([
            'status' => 200,
            'message' => 'Profile updated successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ], 200);
    }

    private function ensureConfiguredAdminUser($email)
    {
        $adminEmail = strtolower((string) env('ADMIN_EMAIL', 'waliza@gmail.com'));

        if (strtolower((string) $email) !== $adminEmail) {
            return;
        }

        $adminPassword = (string) env('ADMIN_PASSWORD', 'waliza123');

        $user = User::whereRaw('LOWER(email) = ?', [$adminEmail])->first();

        if (!$user) {
            $user = new User();
            $user->name = 'Admin';
            $user->email = $adminEmail;
            $user->email_verified_at = now();
            $user->password = Hash::make($adminPassword);
            $user->save();

            return;
        }

        if (!Hash::check($adminPassword, $user->password)) {
            $user->password = Hash::make($adminPassword);
            $user->save();
        }
    }
}

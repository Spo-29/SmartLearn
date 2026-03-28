<?php

use App\Http\Controllers\AccountController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AccountController::class, 'register'])
                ->middleware('guest')
                ->name('register');

Route::post('/login', [AccountController::class, 'authenticate'])
                ->middleware('guest')
                ->name('login');

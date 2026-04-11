<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
        'model_primary' => env('GEMINI_MODEL_PRIMARY', 'gemini-2.5-flash-lite'),
        'model_fallback' => env('GEMINI_MODEL_FALLBACK', 'gemini-2.5-flash'),
        'temperature' => (float) env('GEMINI_TEMPERATURE', 0.2),
        'max_output_tokens' => (int) env('GEMINI_MAX_OUTPUT_TOKENS', 2048),
        'timeout_seconds' => (int) env('GEMINI_TIMEOUT_SECONDS', 60),
        'analysis_temperature' => (float) env('GEMINI_ANALYSIS_TEMPERATURE', 0.2),
        'analysis_max_output_tokens' => (int) env('GEMINI_ANALYSIS_MAX_OUTPUT_TOKENS', 3072),
        'analysis_timeout_seconds' => (int) env('GEMINI_ANALYSIS_TIMEOUT_SECONDS', 90),
        'quiz_temperature' => (float) env('GEMINI_QUIZ_TEMPERATURE', 0.3),
        'quiz_max_output_tokens' => (int) env('GEMINI_QUIZ_MAX_OUTPUT_TOKENS', 4096),
        'quiz_timeout_seconds' => (int) env('GEMINI_QUIZ_TIMEOUT_SECONDS', 90),
        'quiz_question_count' => (int) env('GEMINI_QUIZ_QUESTION_COUNT', 5),
        'inline_video_max_bytes' => (int) env('GEMINI_INLINE_VIDEO_MAX_BYTES', 15728640),
    ],

];

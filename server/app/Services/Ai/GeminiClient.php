<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class GeminiClient
{
    public function generateJson(array $parts, $systemInstruction, array $overrides = [])
    {
        $apiKey = (string) config('services.gemini.api_key');

        if ($apiKey === '') {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $baseUrl = rtrim((string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $primaryModel = (string) ($overrides['model'] ?? config('services.gemini.model_primary', 'gemini-2.5-flash-lite'));
        $fallbackModel = (string) config('services.gemini.model_fallback', 'gemini-2.5-flash');
        $temperature = (float) ($overrides['temperature'] ?? config('services.gemini.temperature', 0.2));
        $maxOutputTokens = (int) ($overrides['max_output_tokens'] ?? config('services.gemini.max_output_tokens', 2048));
        $timeoutSeconds = (int) ($overrides['timeout'] ?? config('services.gemini.timeout_seconds', 60));

        $models = array_values(array_unique(array_filter([$primaryModel, $fallbackModel])));
        $errors = [];

        foreach ($models as $model) {
            try {
                $response = Http::timeout($timeoutSeconds)
                    ->acceptJson()
                    ->post("{$baseUrl}/models/{$model}:generateContent?key={$apiKey}", [
                        'systemInstruction' => [
                            'parts' => [
                                ['text' => (string) $systemInstruction],
                            ],
                        ],
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => $parts,
                            ],
                        ],
                        'generationConfig' => [
                            'temperature' => $temperature,
                            'maxOutputTokens' => $maxOutputTokens,
                            'responseMimeType' => 'application/json',
                        ],
                    ]);

                if (!$response->successful()) {
                    $errors[] = $model . ': HTTP ' . $response->status() . ' ' . mb_substr((string) $response->body(), 0, 400);
                    continue;
                }

                $payload = $response->json();
                $text = $this->extractTextFromPayload($payload);

                if ($text === null) {
                    $errors[] = $model . ': Empty candidate text.';
                    continue;
                }

                $decoded = $this->decodeJsonText($text);

                if (!is_array($decoded)) {
                    $errors[] = $model . ': Could not decode JSON payload.';
                    continue;
                }

                return [
                    'model' => $model,
                    'content' => $decoded,
                    'raw' => $payload,
                ];
            } catch (Throwable $e) {
                $errors[] = $model . ': ' . $e->getMessage();
            }
        }

        throw new RuntimeException('Gemini generation failed. ' . implode(' | ', $errors));
    }

    private function extractTextFromPayload($payload)
    {
        if (!is_array($payload)) {
            return null;
        }

        $candidate = $payload['candidates'][0] ?? null;

        if (!is_array($candidate)) {
            return null;
        }

        $parts = $candidate['content']['parts'] ?? [];
        $texts = [];

        foreach ($parts as $part) {
            if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                $texts[] = $part['text'];
            }
        }

        if (count($texts) === 0) {
            return null;
        }

        return trim(implode("\n", $texts));
    }

    private function decodeJsonText($text)
    {
        $json = trim((string) $text);

        if (str_starts_with($json, '```')) {
            $json = preg_replace('/^```(?:json)?\s*/i', '', $json);
            $json = preg_replace('/\s*```$/', '', (string) $json);
            $json = trim((string) $json);
        }

        $decoded = json_decode($json, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        $start = strpos($json, '{');
        $end = strrpos($json, '}');

        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        $candidate = substr($json, $start, $end - $start + 1);
        $decoded = json_decode($candidate, true);

        return json_last_error() === JSON_ERROR_NONE && is_array($decoded) ? $decoded : null;
    }
}

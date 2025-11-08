<?php

namespace App\Services\Webhooks;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookDispatcher
{
    public function dispatch(string $event, array $payload): void
    {
        $endpoints = array_filter(config('services.fitflow.webhook_endpoints', []));
        if (empty($endpoints)) {
            return;
        }

        $timestamp = (string) now()->getTimestamp();
        $secret = config('services.fitflow.webhook_secret');
        $body = [
            'event' => $event,
            'payload' => $payload,
            'sent_at' => $timestamp,
        ];
        $signature = $secret ? hash_hmac('sha256', $timestamp . json_encode($body), $secret) : null;

        foreach ($endpoints as $endpoint) {
            try {
                Http::withHeaders([
                    'FitFlow-Event' => $event,
                    'FitFlow-Timestamp' => $timestamp,
                    'FitFlow-Signature' => $signature,
                ])->post($endpoint, $body);
            } catch (\Throwable $throwable) {
                Log::warning('Failed to dispatch webhook', [
                    'endpoint' => $endpoint,
                    'event' => $event,
                    'error' => $throwable->getMessage(),
                ]);
            }
        }
    }
}

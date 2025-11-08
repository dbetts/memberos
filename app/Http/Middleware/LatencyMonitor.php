<?php

namespace App\Http\Middleware;

use App\Models\ObservabilityEvent;
use App\Models\Organization;
use App\Models\PerformanceSample;
use Illuminate\Support\Facades\Schema;
use Closure;
use Illuminate\Http\Request;

class LatencyMonitor
{
    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);
        $response = $next($request);
        $duration = microtime(true) - $start;

        $isApi = str_starts_with($request->path(), 'api/');
        $threshold = $isApi
            ? config('observability.latency_thresholds.api', 0.4)
            : config('observability.latency_thresholds.web', 0.25);

        $organizationId = null;
        if (Schema::hasTable('organizations')) {
            $organizationId = $request->header('X-Organization-Id') ?? Organization::value('id');
        }

        if ($organizationId && $request->method() === 'GET' && Schema::hasTable('performance_samples')) {
            PerformanceSample::create([
                'organization_id' => $organizationId,
                'channel' => $isApi ? 'api' : 'web',
                'path' => $request->path(),
                'duration_ms' => (int) round($duration * 1000),
                'recorded_at' => now(),
            ]);
        }

        if ($duration > $threshold && $organizationId && Schema::hasTable('observability_events')) {
            ObservabilityEvent::create([
                'organization_id' => $organizationId,
                'event_type' => 'latency.threshold_exceeded',
                'severity' => 'warning',
                'context' => [
                    'path' => $request->path(),
                    'duration_ms' => (int) round($duration * 1000),
                    'threshold_ms' => (int) round($threshold * 1000),
                ],
            ]);
        }

        return $response;
    }
}

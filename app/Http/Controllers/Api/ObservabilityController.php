<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\ObservabilityEvent;
use App\Models\PerformanceSample;
use App\Models\ReleaseNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObservabilityController extends Controller
{
    use ResolvesOrganization;

    public function events(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $events = ObservabilityEvent::where('organization_id', $organization->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $events]);
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'event_type' => ['required', 'string'],
            'severity' => ['required', 'in:info,warning,error'],
            'context' => ['nullable', 'array'],
        ]);

        $event = ObservabilityEvent::create(array_merge($data, ['organization_id' => $organization->id]));

        return response()->json(['data' => $event], 201);
    }

    public function releaseNotes(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $notes = ReleaseNote::where('organization_id', $organization->id)
            ->orderByDesc('published_at')
            ->limit(20)
            ->get();

        return response()->json(['data' => $notes]);
    }

    public function storeReleaseNote(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'title' => ['required', 'string'],
            'body' => ['required', 'string'],
            'version' => ['nullable', 'string'],
        ]);

        $note = ReleaseNote::create(array_merge($data, [
            'organization_id' => $organization->id,
            'published_at' => now(),
        ]));

        return response()->json(['data' => $note], 201);
    }

    public function slo(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $windowStart = now()->subDay();

        $apiSamples = PerformanceSample::where('organization_id', $organization->id)
            ->where('channel', 'api')
            ->where('recorded_at', '>=', $windowStart)
            ->get('duration_ms');

        $webSamples = PerformanceSample::where('organization_id', $organization->id)
            ->where('channel', 'web')
            ->where('recorded_at', '>=', $windowStart)
            ->get('duration_ms');

        $p95 = fn ($collection) => $collection->isEmpty()
            ? null
            : $collection->sort()->values()->get((int) floor(($collection->count() - 1) * 0.95));

        $apiP95 = $p95($apiSamples->pluck('duration_ms'));
        $webP95 = $p95($webSamples->pluck('duration_ms'));

        $heartbeats = ObservabilityEvent::where('organization_id', $organization->id)
            ->where('event_type', 'uptime.heartbeat')
            ->where('created_at', '>=', $windowStart)
            ->count();

        $expected = (int) (24 * 60 / 5); // every 5 minutes
        $uptime = $expected > 0 ? min(100, round(($heartbeats / $expected) * 100, 2)) : null;

        return response()->json([
            'data' => [
                'api_p95_ms' => $apiP95,
                'web_p95_ms' => $webP95,
                'uptime_percent' => $uptime,
            ],
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\ObservabilityEvent;
use App\Models\Organization;
use App\Models\PerformanceSample;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ObservabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_event_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Obs Org',
            'slug' => 'obs-org',
            'primary_timezone' => 'UTC',
        ]);

        $response = $this->postJson(
            '/api/v1/observability/events',
            ['event_type' => 'test', 'severity' => 'info'],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertCreated();
    }

    public function test_release_note_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Obs Org',
            'slug' => 'obs-org',
            'primary_timezone' => 'UTC',
        ]);

        $response = $this->postJson(
            '/api/v1/observability/release-notes',
            ['title' => 'Deploy', 'body' => 'Shipped new build'],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertCreated();
    }

    public function test_slo_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Obs Org',
            'slug' => 'obs-org',
            'primary_timezone' => 'UTC',
        ]);

        PerformanceSample::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'channel' => 'api',
            'path' => 'api/test',
            'duration_ms' => 200,
            'recorded_at' => now(),
        ]);

        ObservabilityEvent::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'event_type' => 'uptime.heartbeat',
            'severity' => 'info',
        ]);

        $response = $this->getJson('/api/v1/observability/slo', ['X-Organization-Id' => $organization->id]);
        $response->assertOk()->assertJsonStructure(['data' => ['api_p95_ms', 'web_p95_ms', 'uptime_percent']]);
    }
}

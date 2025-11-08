<?php

namespace Tests\Feature;

use App\Models\ClassSession;
use App\Models\Location;
use App\Models\Organization;
use App\Models\WaitlistEntry;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CapacityApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_endpoint_returns_sessions(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Schedule Org',
            'slug' => 'schedule-org',
            'primary_timezone' => 'UTC',
        ]);

        $location = Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'HQ',
        ]);

        $session = ClassSession::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'location_id' => $location->id,
            'class_type' => 'Yoga',
            'starts_at' => CarbonImmutable::now()->addDay(),
            'ends_at' => CarbonImmutable::now()->addDay()->addHour(),
            'capacity' => 20,
        ]);

        WaitlistEntry::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'class_session_id' => $session->id,
            'position' => 1,
            'status' => 'waiting',
        ]);

        $response = $this->getJson('/api/v1/capacity/schedule', ['X-Organization-Id' => $organization->id]);

        $response->assertOk()->assertJsonStructure(['data']);
    }
}

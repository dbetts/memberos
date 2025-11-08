<?php

namespace Tests\Feature;

use App\Models\ClassSession;
use App\Models\Location;
use App\Models\Member;
use App\Models\Organization;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_filters_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Filter Org',
            'slug' => 'filter-org',
            'primary_timezone' => 'UTC',
        ]);

        Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'HQ',
        ]);

        $response = $this->getJson('/api/v1/dashboard/filters', ['X-Organization-Id' => $organization->id]);

        $response->assertOk()->assertJsonStructure(['data' => ['locations', 'class_types', 'plans', 'sources', 'join_months']]);
    }

    public function test_kpis_support_filters(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Filter Org',
            'slug' => 'filter-org',
            'primary_timezone' => 'UTC',
        ]);

        $location = Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'Downtown',
        ]);

        Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'home_location_id' => $location->id,
            'first_name' => 'Jordan',
            'last_name' => 'Lee',
            'status' => 'active',
            'joined_on' => now()->toDateString(),
        ]);

        ClassSession::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'location_id' => $location->id,
            'class_type' => 'HIIT',
            'starts_at' => CarbonImmutable::now()->addDay(),
            'ends_at' => CarbonImmutable::now()->addDay()->addHour(),
        ]);

        $response = $this->getJson('/api/v1/dashboard/kpis?location_id=' . $location->id, ['X-Organization-Id' => $organization->id]);

        $response->assertOk()->assertJsonStructure(['data']);
    }
}

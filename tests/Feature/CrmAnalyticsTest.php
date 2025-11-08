<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_analytics_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'CRM Org',
            'slug' => 'crm-org',
            'primary_timezone' => 'UTC',
        ]);

        $location = Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'HQ',
        ]);

        Lead::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Jordan',
            'last_name' => 'Lee',
            'stage' => 'trial',
            'source' => 'web',
            'preferred_location_id' => $location->id,
        ]);

        $response = $this->getJson('/api/v1/crm/analytics', ['X-Organization-Id' => $organization->id]);

        $response->assertOk()->assertJsonStructure(['data' => ['overview', 'sources', 'locations']]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\ClassType;
use App\Models\Location;
use App\Models\Organization;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_location_settings(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Admin Org',
            'slug' => 'admin-org',
            'primary_timezone' => 'UTC',
        ]);

        $location = Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'HQ',
        ]);

        $response = $this->putJson(
            "/api/v1/admin/locations/{$location->id}",
            [
                'hours' => ['mon' => '06:00-20:00'],
                'cancellation_window_minutes' => 90,
            ],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertOk();
    }

    public function test_class_type_crud(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Admin Org',
            'slug' => 'admin-org',
            'primary_timezone' => 'UTC',
        ]);

        $create = $this->postJson(
            '/api/v1/admin/class-types',
            ['name' => 'Ride 45'],
            ['X-Organization-Id' => $organization->id]
        );

        $create->assertCreated();
    }

    public function test_staff_profile_listing(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Admin Org',
            'slug' => 'admin-org',
            'primary_timezone' => 'UTC',
        ]);

        $user = User::factory()->create();

        StaffProfile::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'organization_id' => $organization->id,
            'is_instructor' => true,
        ]);

        $response = $this->getJson('/api/v1/admin/staff', ['X-Organization-Id' => $organization->id]);
        $response->assertOk();
    }
}

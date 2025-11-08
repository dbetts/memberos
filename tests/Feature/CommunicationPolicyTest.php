<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunicationPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_policy(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Policy Org',
            'slug' => 'policy-org',
            'primary_timezone' => 'UTC',
        ]);

        $response = $this->putJson('/api/v1/communications/policy', [
            'quiet_hours_start' => '21:00',
            'quiet_hours_end' => '08:00',
            'default_daily_cap' => 4,
            'default_weekly_cap' => 14,
            'timezone_strategy' => 'member_preference',
            'enforce_stop_keywords' => true,
        ], ['X-Organization-Id' => $organization->id]);

        $response->assertOk()
            ->assertJsonPath('data.default_daily_cap', 4)
            ->assertJsonPath('data.enforce_stop_keywords', true);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\Organization;
use App\Models\RiskScore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoachControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_roster_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Coach Org',
            'slug' => 'coach-org',
            'primary_timezone' => 'UTC',
        ]);

        $member = Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Jordan',
            'last_name' => 'Lee',
        ]);

        RiskScore::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'member_id' => $member->id,
            'organization_id' => $organization->id,
            'score' => 80,
            'reasons' => [],
            'calculated_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/coach/roster', ['X-Organization-Id' => $organization->id]);

        $response->assertOk()->assertJsonStructure(['data' => ['heatmap', 'members']]);
    }

    public function test_nudge_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Coach Org',
            'slug' => 'coach-org',
            'primary_timezone' => 'UTC',
        ]);

        $member = Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Jordan',
            'last_name' => 'Lee',
        ]);

        $response = $this->postJson(
            '/api/v1/coach/nudges',
            ['member_ids' => [$member->id], 'channel' => 'sms', 'body' => 'We miss you!'],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertOk()->assertJsonPath('data.sent', 1);
    }
}

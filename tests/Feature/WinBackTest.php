<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WinBackTest extends TestCase
{
    use RefreshDatabase;

    public function test_trigger_win_back_endpoint(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Win Org',
            'slug' => 'win-org',
            'primary_timezone' => 'UTC',
        ]);

        Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Ava',
            'last_name' => 'Patel',
            'status' => 'canceled',
            'joined_on' => now()->subYear()->toDateString(),
            'updated_at' => now()->subDays(5),
        ]);

        $response = $this->postJson('/api/v1/retention/win-back/run', ['days' => 30], ['X-Organization-Id' => $organization->id]);

        $response->assertOk();
    }
}

<?php

namespace Tests\Feature;

use App\Models\FreezeRequest;
use App\Models\Member;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FreezeRescueTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_and_update_freeze_request(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Freeze Org',
            'slug' => 'freeze-org',
            'primary_timezone' => 'UTC',
        ]);

        $member = Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Taylor',
            'last_name' => 'Morgan',
            'status' => 'active',
        ]);

        $create = $this->postJson(
            "/api/v1/retention/members/{$member->id}/freeze-requests",
            ['reason' => 'travel'],
            ['X-Organization-Id' => $organization->id]
        );

        $create->assertCreated();
        $freezeRequest = FreezeRequest::first();

        $update = $this->putJson(
            "/api/v1/retention/freeze-requests/{$freezeRequest->id}",
            ['status' => 'rescued'],
            ['X-Organization-Id' => $organization->id]
        );

        $update->assertOk()->assertJsonPath('data.status', 'rescued');
    }
}

<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\ClassSession;
use App\Models\Location;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\Organization;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RetentionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_recalculate_and_heatmap(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Test Org',
            'slug' => 'test-org',
            'primary_timezone' => 'UTC',
        ]);

        $location = Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'HQ',
        ]);

        $plan = MembershipPlan::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'Unlimited',
            'billing_interval' => 'monthly',
        ]);

        $member = Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'home_location_id' => $location->id,
            'membership_plan_id' => $plan->id,
            'first_name' => 'Jordan',
            'last_name' => 'Lee',
            'email_encrypted' => encrypt('jordan@example.com'),
            'email_hash' => hash('sha256', 'jordan@example.com'),
            'status' => 'active',
            'joined_on' => now()->subMonths(6)->toDateString(),
        ]);

        ClassSession::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'location_id' => $location->id,
            'class_type' => 'HIIT',
            'starts_at' => CarbonImmutable::now()->subDays(10),
            'ends_at' => CarbonImmutable::now()->subDays(10)->addHour(),
            'capacity' => 20,
        ]);

        Booking::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'class_session_id' => ClassSession::first()->id,
            'status' => 'no_show',
            'booked_at' => now()->subDays(10),
        ]);

        Payment::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'amount_cents' => 18900,
            'currency' => 'USD',
            'status' => 'overdue',
            'due_on' => now()->subDays(15),
        ]);

        $this->postJson('/api/v1/retention/recalculate', [], ['X-Organization-Id' => $organization->id])
            ->assertOk()
            ->assertJsonPath('data.count', 1);

        $this->getJson('/api/v1/retention/heatmap', ['X-Organization-Id' => $organization->id])
            ->assertOk()
            ->assertJsonStructure(['data' => ['low', 'medium', 'high', 'critical']]);

        $this->getJson('/api/v1/retention/at-risk', ['X-Organization-Id' => $organization->id])
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}

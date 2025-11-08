<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\ClassSession;
use App\Models\Location;
use App\Models\Member;
use App\Models\Organization;
use App\Models\WaitlistEntry;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CapacityDepositTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_marks_deposit_required(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Cap Org',
            'slug' => 'cap-org',
            'primary_timezone' => 'UTC',
        ]);

        $location = Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'HQ',
            'deposit_policy' => ['enabled' => true, 'amount_cents' => 1500, 'threshold_percent' => 10],
        ]);

        $session = ClassSession::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'location_id' => $location->id,
            'class_type' => 'Ride',
            'starts_at' => CarbonImmutable::now()->addDay(),
            'ends_at' => CarbonImmutable::now()->addDay()->addHour(),
            'capacity' => 10,
        ]);

        $member = Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Ava',
            'last_name' => 'Patel',
        ]);

        Booking::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'class_session_id' => $session->id,
            'status' => 'no_show',
            'booked_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/capacity/schedule?range=7d', ['X-Organization-Id' => $organization->id]);
        $response->assertOk()->assertJsonPath('data.0.deposit_required', true);
    }

    public function test_auto_backfill_applies_deposit(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Cap Org',
            'slug' => 'cap-org-2',
            'primary_timezone' => 'UTC',
        ]);
        $location = Location::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'name' => 'GH',
            'deposit_policy' => ['enabled' => true, 'amount_cents' => 2000],
        ]);

        $session = ClassSession::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'location_id' => $location->id,
            'class_type' => 'Ride',
            'starts_at' => CarbonImmutable::now()->addDay(),
            'ends_at' => CarbonImmutable::now()->addDay()->addHour(),
            'capacity' => 10,
        ]);

        $member = Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Jordan',
            'last_name' => 'Lee',
            'status' => 'active',
        ]);

        WaitlistEntry::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'class_session_id' => $session->id,
            'member_id' => $member->id,
            'position' => 1,
            'status' => 'waiting',
        ]);

        $this->postJson('/api/v1/capacity/waitlist/backfill', ['class_session_id' => $session->id], ['X-Organization-Id' => $organization->id])
            ->assertOk();

        $this->assertDatabaseHas('bookings', [
            'member_id' => $member->id,
            'deposit_cents' => 2000,
        ]);
    }
}

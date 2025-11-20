<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\Member;
use App\Models\MemberAccount;
use App\Models\MembershipPlan;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MasterAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $masterPassword = env('MASTER_CONTROL_PASSWORD', 'enclosed');
        $ownerPassword = env('OWNER_PORTAL_PASSWORD', 'enclosed');
        $memberPassword = env('MEMBER_PORTAL_PASSWORD', 'enclosed');

        $organization = Organization::firstOrCreate(
            ['slug' => 'blueaxis-demo'],
            [
                'name' => 'Blue Axis Demo Gym',
                'primary_timezone' => 'America/Los_Angeles',
                'support_email' => 'support@blueaxis.com',
            ]
        );

        $location = Location::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'name' => 'Main Studio',
            ],
            [
                'timezone' => $organization->primary_timezone,
                'room_capacity' => 25,
                'address_line1' => '100 Demo Blvd',
                'city' => 'Austin',
                'state' => 'TX',
                'postal_code' => '78701',
                'country' => 'US',
            ]
        );

        $plan = MembershipPlan::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'external_id' => 'BA-DEMO-UNL',
            ],
            [
                'name' => 'Demo Unlimited',
                'billing_interval' => 'monthly',
                'price_cents' => 12900,
                'currency' => 'USD',
            ]
        );

        User::updateOrCreate(
            ['email' => 'derrick@blueaxis.com'],
            [
                'name' => 'Master Controller',
                'password' => Hash::make($masterPassword),
                'is_master' => true,
                'organization_id' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'derrick+owner@blueaxis.com'],
            [
                'name' => 'Gym Owner',
                'password' => Hash::make($ownerPassword),
                'organization_id' => $organization->id,
                'primary_location_id' => $location->id,
                'default_role' => 'owner',
                'is_master' => false,
            ]
        );

        $member = Member::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'email_hash' => hash('sha256', 'derrick+member@blueaxis.com'),
            ],
            [
                'home_location_id' => $location->id,
                'membership_plan_id' => $plan->id,
                'first_name' => 'Demo',
                'last_name' => 'Member',
                'email_encrypted' => encrypt('derrick+member@blueaxis.com'),
                'status' => 'active',
                'joined_on' => now()->toDateString(),
            ]
        );

        MemberAccount::updateOrCreate(
            ['email' => 'derrick+member@blueaxis.com'],
            [
                'member_id' => $member->id,
                'password' => Hash::make($memberPassword),
            ]
        );
    }
}

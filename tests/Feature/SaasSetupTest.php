<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SaasSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_onboarding_creates_organization_and_admin(): void
    {
        $response = $this->postJson('/api/v1/onboarding/signup', [
            'organization_name' => 'Test Gym',
            'timezone' => 'UTC',
            'subdomain' => 'testgym-' . Str::random(4),
            'custom_domain' => null,
            'support_email' => 'support@testgym.com',
            'admin_name' => 'Owner McAdmin',
            'admin_email' => 'owner@testgym.com',
            'admin_password' => 'Password123!',
            'primary_color' => '#123456',
            'accent_color' => '#654321',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('organizations', [
            'name' => 'Test Gym',
            'support_email' => 'support@testgym.com',
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'owner@testgym.com',
        ]);
    }

    public function test_member_creation_generates_portal_credentials(): void
    {
        $organization = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Portal Org',
            'slug' => 'portal-org',
            'primary_timezone' => 'UTC',
            'is_active' => true,
        ]);

        $response = $this->postJson(
            '/api/v1/members',
            [
                'first_name' => 'Casey',
                'last_name' => 'Lee',
                'email' => 'casey@example.com',
                'portal_email' => 'casey.portal@example.com',
            ],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertCreated();
        $this->assertDatabaseHas('members', [
            'organization_id' => $organization->id,
            'first_name' => 'Casey',
        ]);
        $this->assertDatabaseHas('member_accounts', [
            'email' => 'casey.portal@example.com',
        ]);
    }
}

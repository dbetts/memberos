<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunicationComplianceTest extends TestCase
{
    use RefreshDatabase;

    public function test_domain_creation(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Com Org',
            'slug' => 'com-org',
            'primary_timezone' => 'UTC',
        ]);

        $response = $this->postJson(
            '/api/v1/compliance/domains',
            ['domain' => 'studio.example.com'],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertCreated();
    }

    public function test_sms_registration_creation(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Com Org',
            'slug' => 'com-org',
            'primary_timezone' => 'UTC',
        ]);

        $response = $this->postJson(
            '/api/v1/compliance/sms',
            ['brand_name' => 'FitFlow', 'campaign_name' => 'Reminders'],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertCreated();
    }
}

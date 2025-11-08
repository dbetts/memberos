<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MindbodyImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_creates_members(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Import Org',
            'slug' => 'import-org',
            'primary_timezone' => 'UTC',
        ]);

        $payload = [
            'members' => [
                [
                    'first_name' => 'Jordan',
                    'last_name' => 'Lee',
                    'email' => 'jordan@example.com',
                    'phone' => '+14155550100',
                ],
            ],
        ];

        $this->postJson('/api/v1/integrations/mindbody/import', $payload, ['X-Organization-Id' => $organization->id])
            ->assertOk();

        $this->assertDatabaseHas('members', [
            'organization_id' => $organization->id,
            'email_hash' => hash('sha256', 'jordan@example.com'),
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadConversionTest extends TestCase
{
    use RefreshDatabase;

    public function test_lead_converts_to_member(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Test Org',
            'slug' => 'lead-convert-org',
            'primary_timezone' => 'UTC',
        ]);
        $lead = Lead::create([
            'organization_id' => $organization->id,
            'first_name' => 'Taylor',
            'last_name' => 'Morgan',
            'email_encrypted' => encrypt('taylor@example.com'),
            'email_hash' => hash('sha256', 'taylor@example.com'),
            'stage' => 'trial',
        ]);

        $response = $this->postJson("/api/v1/crm/leads/{$lead->id}/convert", [], ['X-Organization-Id' => $organization->id]);

        $response->assertCreated();
        $this->assertDatabaseHas('members', ['email_hash' => hash('sha256', 'taylor@example.com')]);
    }
}

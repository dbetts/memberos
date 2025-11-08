<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Member;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GraphqlTest extends TestCase
{
    use RefreshDatabase;

    public function test_graphql_endpoint_returns_requested_fields(): void
    {
        $organization = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Graph Org',
            'slug' => 'graph-org',
            'primary_timezone' => 'UTC',
        ]);

        Member::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Jordan',
            'last_name' => 'Lee',
            'status' => 'active',
        ]);

        Lead::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'organization_id' => $organization->id,
            'first_name' => 'Sam',
            'last_name' => 'Carter',
            'stage' => 'trial',
        ]);

        $response = $this->postJson(
            '/api/v1/graphql',
            ['query' => '{ members { id } leads { id } }'],
            ['X-Organization-Id' => $organization->id]
        );

        $response->assertOk()->assertJsonStructure(['data' => ['members', 'leads']]);
    }
}

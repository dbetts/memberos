<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    use ResolvesOrganization;

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $leads = Lead::where('organization_id', $organization->id)
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['data' => $leads]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $data = $request->validate([
            'first_name' => ['required', 'string'],
            'last_name' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'stage' => ['nullable', 'string'],
            'source' => ['nullable', 'string'],
            'preferred_location_id' => ['nullable', 'uuid'],
        ]);

        $lead = Lead::create([
            'organization_id' => $organization->id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email_encrypted' => isset($data['email']) ? encrypt($data['email']) : null,
            'email_hash' => isset($data['email']) ? hash('sha256', strtolower($data['email'])) : null,
            'phone_encrypted' => isset($data['phone']) ? encrypt($data['phone']) : null,
            'phone_hash' => isset($data['phone']) ? hash('sha256', preg_replace('/[^\\d+]/', '', $data['phone'])) : null,
            'stage' => $data['stage'] ?? 'new',
            'source' => $data['source'] ?? 'manual',
            'preferred_location_id' => $data['preferred_location_id'] ?? null,
        ]);

        return response()->json(['data' => $lead], 201);
    }
}

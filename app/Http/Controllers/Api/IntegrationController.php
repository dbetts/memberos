<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\Data\IdentityResolutionService;
use App\Services\Integrations\MindbodyImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    use ResolvesOrganization;

    public function __construct(
        private readonly MindbodyImportService $mindbodyImportService,
        private readonly IdentityResolutionService $identityResolutionService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $integrations = Integration::where('organization_id', $organization->id)->get();

        return response()->json(['data' => $integrations]);
    }

    public function importMindbody(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $payload = $request->validate([
            'locations' => ['nullable', 'array'],
            'locations.*.name' => ['required_with:locations', 'string'],
            'plans' => ['nullable', 'array'],
            'plans.*.name' => ['required_with:plans', 'string'],
            'members' => ['required', 'array'],
            'members.*.first_name' => ['required', 'string'],
            'members.*.last_name' => ['required', 'string'],
            'members.*.email' => ['nullable', 'email'],
            'members.*.phone' => ['nullable', 'string'],
            'sessions' => ['nullable', 'array'],
        ]);

        $batch = $this->mindbodyImportService->importMockPayload($organization, $payload, optional($request->user())->id);

        $this->identityResolutionService->queueCandidatesForOrganization($organization);

        return response()->json(['data' => $batch]);
    }
}

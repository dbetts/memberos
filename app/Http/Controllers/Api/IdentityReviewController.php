<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\MemberMergeCandidate;
use App\Services\Data\IdentityResolutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IdentityReviewController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly IdentityResolutionService $identityResolutionService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $candidates = $this->identityResolutionService->listPending($organization);

        return response()->json(['data' => $candidates]);
    }

    public function resolve(Request $request, MemberMergeCandidate $candidate): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($candidate->organization_id === $organization->id, 404);

        $data = $request->validate([
            'status' => ['required', Rule::in(['merged', 'dismissed'])],
            'notes' => ['nullable', 'string'],
        ]);

        $candidate = $this->identityResolutionService->resolve($candidate, $data['status'], $data['notes'] ?? null);

        return response()->json(['data' => $candidate]);
    }
}

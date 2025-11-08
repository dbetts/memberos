<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\FreezeRequest;
use App\Models\Member;
use App\Services\Retention\FreezeRescueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FreezeRequestController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly FreezeRescueService $freezeRescueService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $requests = FreezeRequest::with('member')
            ->where('organization_id', $organization->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $requests]);
    }

    public function store(Request $request, Member $member): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($member->organization_id === $organization->id, 404);

        $data = $request->validate([
            'reason' => ['nullable', 'string'],
            'requested_on' => ['nullable', 'date'],
            'offer' => ['nullable', 'array'],
        ]);

        $freezeRequest = $this->freezeRescueService->createRequest($organization, $member, $data);

        return response()->json(['data' => $freezeRequest], 201);
    }

    public function update(Request $request, FreezeRequest $freezeRequest): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($freezeRequest->organization_id === $organization->id, 404);

        $data = $request->validate([
            'status' => ['required', 'in:rescued,declined,approved'],
            'resolution' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);

        $updated = $this->freezeRescueService->resolve($freezeRequest, array_merge($data, [
            'handled_by' => optional($request->user())->id,
        ]));

        return response()->json(['data' => $updated]);
    }
}

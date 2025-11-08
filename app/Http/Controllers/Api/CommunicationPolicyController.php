<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Services\Communications\CommunicationPolicyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunicationPolicyController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly CommunicationPolicyService $policyService)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $policy = $this->policyService->getPolicy($organization);

        return response()->json(['data' => $policy]);
    }

    public function update(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'quiet_hours_start' => ['nullable', 'date_format:H:i'],
            'quiet_hours_end' => ['nullable', 'date_format:H:i'],
            'default_daily_cap' => ['nullable', 'integer', 'min:0'],
            'default_weekly_cap' => ['nullable', 'integer', 'min:0'],
            'timezone_strategy' => ['nullable', 'in:member_preference,organization'],
            'enforce_stop_keywords' => ['nullable', 'boolean'],
        ]);

        $policy = $this->policyService->updatePolicy($organization, $data + [
            'updated_by' => optional($request->user())->id,
        ]);

        return response()->json(['data' => $policy]);
    }
}

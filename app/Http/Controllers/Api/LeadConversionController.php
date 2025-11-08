<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStageLog;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadConversionController extends Controller
{
    use ResolvesOrganization;

    public function __invoke(Request $request, Lead $lead): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($lead->organization_id === $organization->id, 404);

        $data = $request->validate([
            'membership_plan_id' => ['nullable', 'uuid'],
            'status' => ['nullable', 'string'],
        ]);

        $member = Member::create([
            'organization_id' => $organization->id,
            'first_name' => $lead->first_name,
            'last_name' => $lead->last_name,
            'email_encrypted' => $lead->email_encrypted,
            'email_hash' => $lead->email_hash,
            'phone_encrypted' => $lead->phone_encrypted,
            'phone_hash' => $lead->phone_hash,
            'membership_plan_id' => $data['membership_plan_id'] ?? null,
            'status' => $data['status'] ?? 'active',
            'joined_on' => now()->toDateString(),
            'consents' => $lead->consents,
        ]);

        $previousStage = $lead->stage;
        $lead->stage = 'close';
        $lead->converted_member_id = $member->id;
        $lead->save();

        LeadStageLog::create([
            'lead_id' => $lead->id,
            'from_stage' => $previousStage,
            'to_stage' => 'close',
            'changed_at' => now(),
        ]);

        return response()->json(['data' => $member], 201);
    }
}

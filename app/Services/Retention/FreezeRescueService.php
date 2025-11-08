<?php

namespace App\Services\Retention;

use App\Models\FreezeRequest;
use App\Models\Member;
use App\Models\Organization;
use App\Models\Playbook;
use Illuminate\Support\Arr;

class FreezeRescueService
{
    public function __construct(private readonly PlaybookTriggerService $playbookTriggerService)
    {
    }

    public function createRequest(Organization $organization, Member $member, array $payload): FreezeRequest
    {
        $request = FreezeRequest::create([
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'requested_on' => Arr::get($payload, 'requested_on', now()->toDateString()),
            'reason' => Arr::get($payload, 'reason'),
            'status' => 'pending',
            'offer' => Arr::get($payload, 'offer'),
        ]);

        if ($playbook = $this->resolveFreezePlaybook($organization)) {
            $this->playbookTriggerService->triggerForMember(
                $organization,
                $member,
                $playbook,
                ['reason' => 'freeze_intent']
            );
        }

        return $request;
    }

    public function resolve(FreezeRequest $request, array $payload): FreezeRequest
    {
        $request->status = Arr::get($payload, 'status', 'declined');
        $request->resolution = Arr::get($payload, 'resolution');
        $request->handled_by = Arr::get($payload, 'handled_by');
        $request->handled_at = now();
        $request->notes = Arr::get($payload, 'notes');
        $request->save();

        return $request;
    }

    protected function resolveFreezePlaybook(Organization $organization): ?Playbook
    {
        return Playbook::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->where('trigger_type', 'freeze_request')
            ->first();
    }
}

<?php

namespace App\Services\Retention;

use App\Models\Member;
use App\Models\Organization;
use App\Models\Playbook;
use Carbon\CarbonImmutable;

class WinBackService
{
    public function __construct(private readonly PlaybookTriggerService $playbookTriggerService)
    {
    }

    public function triggerForRecentCancels(Organization $organization, int $days = 30): int
    {
        $since = CarbonImmutable::now()->subDays($days);

        $members = Member::where('organization_id', $organization->id)
            ->where('status', 'canceled')
            ->where('updated_at', '>=', $since)
            ->get();

        if ($members->isEmpty()) {
            return 0;
        }

        $playbook = Playbook::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->where('trigger_type', 'win_back')
            ->first();

        if (! $playbook) {
            return 0;
        }

        foreach ($members as $member) {
            $this->playbookTriggerService->triggerForMember(
                $organization,
                $member,
                $playbook,
                ['reason' => 'win_back']
            );
        }

        return $members->count();
    }
}

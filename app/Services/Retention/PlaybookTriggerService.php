<?php

namespace App\Services\Retention;

use App\Jobs\ProcessPlaybookExecution;
use App\Models\Member;
use App\Models\Organization;
use App\Models\Playbook;
use App\Models\PlaybookExecution;
use Illuminate\Support\Facades\Config;

class PlaybookTriggerService
{
    public function triggerForMember(Organization $organization, Member $member, Playbook $playbook, array $context = []): PlaybookExecution
    {
        $execution = PlaybookExecution::create([
            'playbook_id' => $playbook->id,
            'playbook_version_id' => $playbook->versions()->orderByDesc('version')->value('id'),
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'status' => 'pending',
            'context' => $context,
            'triggered_at' => now(),
        ]);

        $slaSeconds = $this->resolveSlaSeconds($organization);

        ProcessPlaybookExecution::dispatch($execution->id, $slaSeconds)->onQueue('playbooks');

        return $execution;
    }

    protected function resolveSlaSeconds(Organization $organization): int
    {
        $setting = $organization->settings()
            ->where('category', 'retention_engine')
            ->value('settings');

        return (int) ($setting['processing_sla_seconds'] ?? Config::get('retention.processing_sla_seconds', 300));
    }
}

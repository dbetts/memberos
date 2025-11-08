<?php

namespace App\Services\Retention;

use App\Models\Organization;
use App\Models\Playbook;
use App\Models\PlaybookVersion;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PlaybookService
{
    public function list(Organization $organization)
    {
        return Playbook::query()
            ->with('primaryTemplate')
            ->where('organization_id', $organization->id)
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get();
    }

    public function create(Organization $organization, array $payload, ?int $userId = null): Playbook
    {
        return DB::transaction(function () use ($organization, $payload, $userId) {
            $playbook = Playbook::create([
                'organization_id' => $organization->id,
                'name' => Arr::get($payload, 'name'),
                'status' => 'draft',
                'trigger_type' => Arr::get($payload, 'trigger_type'),
                'trigger_config' => Arr::get($payload, 'trigger_config'),
                'audience_filter' => Arr::get($payload, 'audience_filter'),
                'channel_strategy' => Arr::get($payload, 'channel_strategy'),
                'throttle_rules' => Arr::get($payload, 'throttle_rules'),
                'quiet_hours' => Arr::get($payload, 'quiet_hours'),
                'primary_template_id' => Arr::get($payload, 'primary_template_id'),
                'description' => Arr::get($payload, 'description'),
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->createVersion($playbook, $payload, $userId);

            return $playbook->fresh(['primaryTemplate', 'versions']);
        });
    }

    public function update(Playbook $playbook, array $payload, ?int $userId = null): Playbook
    {
        return DB::transaction(function () use ($playbook, $payload, $userId) {
            $playbook->fill(Arr::only($payload, [
                'name',
                'trigger_type',
                'trigger_config',
                'audience_filter',
                'channel_strategy',
                'throttle_rules',
                'quiet_hours',
                'primary_template_id',
                'description',
            ]));
            $playbook->updated_by = $userId;
            $playbook->save();

            $this->createVersion($playbook, $payload, $userId);

            return $playbook->fresh(['primaryTemplate', 'versions']);
        });
    }

    public function activate(Playbook $playbook, ?int $userId = null): Playbook
    {
        if ($playbook->status === 'active') {
            return $playbook;
        }

        $playbook->status = 'active';
        $playbook->activated_at = now();
        $playbook->paused_at = null;
        $playbook->updated_by = $userId;
        $playbook->save();

        return $playbook;
    }

    public function pause(Playbook $playbook, ?int $userId = null): Playbook
    {
        if ($playbook->status === 'paused') {
            return $playbook;
        }

        $playbook->status = 'paused';
        $playbook->paused_at = now();
        $playbook->updated_by = $userId;
        $playbook->save();

        return $playbook;
    }

    public function archive(Playbook $playbook, ?int $userId = null): void
    {
        $playbook->archived_at = now();
        $playbook->updated_by = $userId;
        $playbook->save();
    }

    protected function createVersion(Playbook $playbook, array $payload, ?int $userId = null): PlaybookVersion
    {
        $definition = Arr::only($payload, [
            'trigger_type',
            'trigger_config',
            'audience_filter',
            'channel_strategy',
            'throttle_rules',
            'quiet_hours',
            'primary_template_id',
        ]);

        $latestVersion = PlaybookVersion::where('playbook_id', $playbook->id)
            ->max('version');

        return PlaybookVersion::create([
            'playbook_id' => $playbook->id,
            'version' => ($latestVersion ?? 0) + 1,
            'definition' => $definition,
            'change_summary' => Arr::get($payload, 'change_summary'),
            'created_by' => $userId,
        ]);
    }
}

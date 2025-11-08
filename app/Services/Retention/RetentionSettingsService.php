<?php

namespace App\Services\Retention;

use App\Models\Organization;
use App\Models\RetentionSetting;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Config;

class RetentionSettingsService
{
    public function getSettings(Organization $organization): array
    {
        $dbSettings = RetentionSetting::query()
            ->where('organization_id', $organization->id)
            ->get()
            ->pluck('value', 'key')
            ->toArray();

        return array_replace_recursive(Config::get('retention', []), $dbSettings);
    }

    public function updateSettings(Organization $organization, array $payload, ?int $userId = null): array
    {
        foreach ($payload as $key => $value) {
            RetentionSetting::updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'key' => $key,
                ],
                [
                    'value' => $value,
                    'updated_by' => $userId,
                ]
            );
        }

        return $this->getSettings($organization);
    }
}

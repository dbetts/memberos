<?php

namespace App\Services\Communications;

use App\Models\CommunicationPolicy;
use App\Models\Organization;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Config;

class CommunicationPolicyService
{
    public function getPolicy(Organization $organization): CommunicationPolicy
    {
        return CommunicationPolicy::firstOrCreate(
            ['organization_id' => $organization->id],
            [
                'quiet_hours_start' => Config::get('communications.quiet_hours.start', '21:00:00'),
                'quiet_hours_end' => Config::get('communications.quiet_hours.end', '08:00:00'),
                'default_daily_cap' => Config::get('communications.send_caps.daily', 3),
                'default_weekly_cap' => Config::get('communications.send_caps.weekly', 12),
                'timezone_strategy' => 'member_preference',
                'enforce_stop_keywords' => true,
            ],
        );
    }

    public function updatePolicy(Organization $organization, array $payload): CommunicationPolicy
    {
        $policy = $this->getPolicy($organization);

        $policy->fill([
            'quiet_hours_start' => Arr::get($payload, 'quiet_hours_start', $policy->quiet_hours_start),
            'quiet_hours_end' => Arr::get($payload, 'quiet_hours_end', $policy->quiet_hours_end),
            'default_daily_cap' => Arr::get($payload, 'default_daily_cap', $policy->default_daily_cap),
            'default_weekly_cap' => Arr::get($payload, 'default_weekly_cap', $policy->default_weekly_cap),
            'timezone_strategy' => Arr::get($payload, 'timezone_strategy', $policy->timezone_strategy),
            'enforce_stop_keywords' => Arr::get($payload, 'enforce_stop_keywords', $policy->enforce_stop_keywords),
        ]);

        $policy->save();

        return $policy;
    }
}

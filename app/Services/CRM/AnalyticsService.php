<?php

namespace App\Services\CRM;

use App\Models\Lead;
use App\Models\Organization;

class AnalyticsService
{
    public function summary(Organization $organization): array
    {
        $leads = Lead::query()
            ->with('preferredLocation')
            ->where('organization_id', $organization->id)
            ->get();

        $total = $leads->count();
        $trial = $leads->where('stage', 'trial')->count();
        $close = $leads->where('stage', 'close')->count();

        $bySource = $leads->groupBy(fn ($lead) => $lead->source ?? 'Unknown')->map(function ($group) {
            $total = $group->count();
            $trial = $group->where('stage', 'trial')->count();
            $close = $group->where('stage', 'close')->count();

            return [
                'total' => $total,
                'trial' => $trial,
                'close' => $close,
                'lead_to_trial' => $total ? round(($trial / $total) * 100, 1) : 0,
                'trial_to_join' => $trial ? round(($close / max(1, $trial)) * 100, 1) : 0,
            ];
        });

        $byLocation = $leads->groupBy(fn ($lead) => optional($lead->preferredLocation)->name ?? 'Unassigned')
            ->map(function ($group) {
                $total = $group->count();
                $close = $group->where('stage', 'close')->count();

                return [
                    'total' => $total,
                    'close' => $close,
                    'conversion' => $total ? round(($close / $total) * 100, 1) : 0,
                ];
            });

        return [
            'overview' => [
                'total' => $total,
                'trial' => $trial,
                'close' => $close,
                'lead_to_trial' => $total ? round(($trial / $total) * 100, 1) : 0,
                'trial_to_join' => $trial ? round(($close / max(1, $trial)) * 100, 1) : 0,
            ],
            'sources' => $bySource,
            'locations' => $byLocation,
        ];
    }
}

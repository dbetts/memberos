<?php

namespace App\Services\Coach;

use App\Models\Organization;
use App\Models\RiskScore;
use App\Services\Retention\RiskScoringService;

class RosterService
{
    public function __construct(private readonly RiskScoringService $riskScoringService)
    {
    }

    public function roster(Organization $organization, ?string $classType = null): array
    {
        $scores = RiskScore::with(['member.bookings.session'])
            ->where('organization_id', $organization->id)
            ->when($classType, function ($query) use ($classType) {
                $query->whereHas('member.bookings.session', function ($builder) use ($classType) {
                    $builder->where('class_type', $classType);
                });
            })
            ->limit(200)
            ->get();

        $settings = $this->riskScoringService->resolveSettings($organization->id);

        $heatmap = ['Low' => 0, 'Med' => 0, 'High' => 0];
        $members = [];

        foreach ($scores as $score) {
            $band = $this->band($score->score, $settings);
            $heatmap[$band] = ($heatmap[$band] ?? 0) + 1;

            $session = optional($score->member->bookings->first())->session;

            $members[] = [
                'member_id' => $score->member_id,
                'name' => trim($score->member->first_name . ' ' . $score->member->last_name),
                'class_type' => $session?->class_type,
                'starts_at' => $session?->starts_at,
                'risk_score' => $score->score,
                'risk_band' => $band,
            ];
        }

        return [
            'heatmap' => $heatmap,
            'members' => $members,
        ];
    }

    protected function band(int $score, array $settings): string
    {
        $resolved = $this->riskScoringService->resolveRiskBand($score, $settings);
        return match ($resolved) {
            'high', 'critical' => 'High',
            'medium' => 'Med',
            default => 'Low',
        };
    }
}

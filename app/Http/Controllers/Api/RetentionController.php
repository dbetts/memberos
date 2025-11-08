<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Playbook;
use App\Services\Retention\RetentionSettingsService;
use App\Services\Retention\RiskScoringService;
use App\Services\Retention\PlaybookTriggerService;
use App\Services\Retention\WinBackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RetentionController extends Controller
{
    use ResolvesOrganization;

    public function __construct(
        private readonly RiskScoringService $riskScoringService,
        private readonly RetentionSettingsService $settingsService,
        private readonly PlaybookTriggerService $playbookTriggerService,
        private readonly WinBackService $winBackService
    ) {
    }

    public function heatmap(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $heatmap = $this->riskScoringService->buildHeatmap($organization);

        return response()->json([
            'data' => $heatmap,
        ]);
    }

    public function atRiskRoster(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $limit = (int) $request->query('limit', 50);

        $riskScores = $this->riskScoringService->fetchAtRiskMembers($organization, $limit)
            ->map(function ($riskScore) {
                return [
                    'member_id' => $riskScore->member_id,
                    'score' => $riskScore->score,
                    'reasons' => $riskScore->reasons,
                    'member' => [
                        'name' => trim($riskScore->member->first_name . ' ' . $riskScore->member->last_name),
                        'status' => $riskScore->member->status,
                        'last_check_in_days' => $this->resolveDaysSinceLastCheckIn($riskScore->member),
                    ],
                ];
            });

        return response()->json(['data' => $riskScores]);
    }

    public function recalculate(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $scores = $this->riskScoringService->calculateForOrganization($organization);

        $settings = $this->settingsService->getSettings($organization);
        $highBand = $settings['risk_bands']['high'] ?? ['min' => 61];
        $threshold = $highBand['min'] ?? 61;

        $playbook = Playbook::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->where('trigger_type', 'no_check_in')
            ->first();

        if ($playbook) {
            $scores->each(function ($riskScore) use ($organization, $threshold, $playbook): void {
                if ($riskScore->score >= $threshold && $riskScore->member) {
                    $this->playbookTriggerService->triggerForMember(
                        $organization,
                        $riskScore->member,
                        $playbook,
                        ['reason' => 'high_risk']
                    );
                }
            });
        }

        return response()->json([
            'data' => [
                'count' => $scores->count(),
            ],
        ]);
    }

    public function showSettings(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $settings = $this->settingsService->getSettings($organization);

        return response()->json(['data' => $settings]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $payload = $request->validate([
            'risk_bands' => ['sometimes', 'array'],
            'risk_bands.low.min' => ['nullable', 'integer'],
            'risk_bands.low.max' => ['nullable', 'integer'],
            'risk_bands.medium.min' => ['nullable', 'integer'],
            'risk_bands.medium.max' => ['nullable', 'integer'],
            'risk_bands.high.min' => ['nullable', 'integer'],
            'risk_bands.high.max' => ['nullable', 'integer'],
            'risk_bands.critical.min' => ['nullable', 'integer'],
            'risk_bands.critical.max' => ['nullable', 'integer'],
            'streak_break_days' => ['sometimes', 'integer', 'min:1'],
            'missed_bookings_threshold' => ['sometimes', 'array'],
            'missed_bookings_threshold.count' => ['nullable', 'integer', 'min:1'],
            'missed_bookings_threshold.window_days' => ['nullable', 'integer', 'min:1'],
            'billing_risk' => ['sometimes', 'array'],
            'billing_risk.overdue_days' => ['nullable', 'integer', 'min:1'],
        ]);

        $settings = $this->settingsService->updateSettings($organization, $payload, optional($request->user())->id);

        return response()->json(['data' => $settings]);
    }

    protected function resolveDaysSinceLastCheckIn(Member $member): ?int
    {
        $lastCheckIn = $member->checkIns()
            ->latest('checked_in_at')
            ->value('checked_in_at');

        return $lastCheckIn ? now()->diffInDays($lastCheckIn) : null;
    }

    public function updateEngineSettings(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'processing_sla_seconds' => ['required', 'integer', 'min:60', 'max:3600'],
        ]);

        $organization->settings()->updateOrCreate(
            ['category' => 'retention_engine'],
            [
                'settings' => $data,
                'updated_by' => optional($request->user())->id,
            ]
        );

        return response()->json(['data' => $data]);
    }

    public function triggerWinBack(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $days = (int) $request->input('days', 30);
        $count = $this->winBackService->triggerForRecentCancels($organization, $days);

        return response()->json(['data' => ['triggered' => $count]]);
    }
}

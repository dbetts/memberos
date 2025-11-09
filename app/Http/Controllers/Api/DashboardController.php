<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Services\Reporting\KpiService;
use App\Services\Retention\RiskScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ResolvesOrganization;

    public function __construct(
        private readonly KpiService $kpiService,
        private readonly RiskScoringService $riskScoringService
    )
    {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $filters = $request->only([
            'location_id',
            'class_type',
            'instructor_id',
            'plan_id',
            'source',
            'join_month',
        ]);

        $kpis = $this->kpiService->getDashboardKpis($organization, array_filter($filters));

        return response()->json([
            'data' => $kpis,
        ]);
    }

    public function filters(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $filters = $this->kpiService->availableFilters($organization);

        return response()->json(['data' => $filters]);
    }

    public function overview(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $filters = $request->only([
            'location_id',
            'class_type',
            'instructor_id',
            'plan_id',
            'source',
            'join_month',
        ]);

        $kpis = $this->kpiService->getDashboardKpis($organization, array_filter($filters));

        $atRisk = $this->riskScoringService->fetchAtRiskMembers($organization, 8)
            ->map(function ($riskScore) {
                $lastCheckIn = $riskScore->member
                    ? $riskScore->member->checkIns()->latest('checked_in_at')->value('checked_in_at')
                    : null;

                return [
                    'member_id' => $riskScore->member_id,
                    'score' => $riskScore->score,
                    'reasons' => $riskScore->reasons,
                    'member' => [
                        'name' => trim($riskScore->member->first_name . ' ' . $riskScore->member->last_name),
                        'status' => $riskScore->member->status,
                        'last_check_in_days' => $lastCheckIn ? now()->diffInDays($lastCheckIn) : null,
                    ],
                ];
            });

        return response()->json([
            'data' => [
                'filters' => $this->kpiService->availableFilters($organization),
                'kpis' => $kpis,
                'at_risk' => $atRisk,
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Services\Reporting\KpiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly KpiService $kpiService)
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
}

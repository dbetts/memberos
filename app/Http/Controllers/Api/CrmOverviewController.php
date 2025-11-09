<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\CRM\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CrmOverviewController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly AnalyticsService $analyticsService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $leads = Lead::where('organization_id', $organization->id)
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get();

        $analytics = $this->analyticsService->summary($organization);

        return response()->json([
            'data' => [
                'leads' => $leads,
                'analytics' => $analytics,
            ],
        ]);
    }
}

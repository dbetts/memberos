<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Services\CRM\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CrmAnalyticsController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly AnalyticsService $analyticsService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $this->analyticsService->summary($organization);

        return response()->json(['data' => $data]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Member;
use App\Services\Reporting\KpiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GraphqlController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly KpiService $kpiService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $query = $request->input('query', '');

        $payload = [];

        if (stripos($query, 'kpis') !== false) {
            $payload['kpis'] = $this->kpiService->getDashboardKpis($organization);
        }

        if (stripos($query, 'members') !== false) {
            $payload['members'] = Member::where('organization_id', $organization->id)
                ->limit(25)
                ->get(['id', 'first_name', 'last_name', 'status']);
        }

        if (stripos($query, 'leads') !== false) {
            $payload['leads'] = Lead::where('organization_id', $organization->id)
                ->limit(25)
                ->get(['id', 'first_name', 'last_name', 'stage', 'source']);
        }

        if (empty($payload)) {
            return response()->json([
                'errors' => [
                    ['message' => 'Query did not request any supported fields.'],
                ],
            ], 400);
        }

        return response()->json(['data' => $payload]);
    }
}

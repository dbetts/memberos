<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\ClassType;
use App\Services\Coach\RosterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachOverviewController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly RosterService $rosterService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $classTypes = ClassType::where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $classType = $request->query('class_type');
        $roster = $this->rosterService->roster($organization, $classType);

        return response()->json([
            'data' => [
                'class_types' => $classTypes,
                'roster' => $roster,
            ],
        ]);
    }
}

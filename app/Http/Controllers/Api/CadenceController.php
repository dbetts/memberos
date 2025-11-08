<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Cadence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CadenceController extends Controller
{
    use ResolvesOrganization;

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $cadences = Cadence::with('steps')
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $cadences]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLocationController extends Controller
{
    use ResolvesOrganization;

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $locations = Location::where('organization_id', $organization->id)->get();

        return response()->json(['data' => $locations]);
    }

    public function update(Request $request, Location $location): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($location->organization_id === $organization->id, 404);

        $data = $request->validate([
            'hours' => ['nullable', 'array'],
            'deposit_policy' => ['nullable', 'array'],
            'cancellation_window_minutes' => ['nullable', 'integer', 'min:10'],
        ]);

        $location->fill($data);
        $location->save();

        return response()->json(['data' => $location]);
    }
}

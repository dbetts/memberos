<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffProfileController extends Controller
{
    use ResolvesOrganization;

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $staff = StaffProfile::with(['user', 'primaryLocation'])
            ->where('organization_id', $organization->id)
            ->get();

        return response()->json(['data' => $staff]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['nullable', 'string'],
            'is_instructor' => ['required', 'boolean'],
            'bio' => ['nullable', 'string'],
            'primary_location_id' => ['nullable', 'uuid'],
        ]);

        $profile = StaffProfile::create(array_merge($data, ['organization_id' => $organization->id]));

        return response()->json(['data' => $profile], 201);
    }

    public function update(Request $request, StaffProfile $staffProfile): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($staffProfile->organization_id === $organization->id, 404);

        $data = $request->validate([
            'title' => ['sometimes', 'string'],
            'is_instructor' => ['sometimes', 'boolean'],
            'bio' => ['nullable', 'string'],
            'certifications' => ['nullable', 'array'],
            'specialties' => ['nullable', 'array'],
            'primary_location_id' => ['nullable', 'uuid'],
        ]);

        $staffProfile->fill($data);
        $staffProfile->save();

        return response()->json(['data' => $staffProfile]);
    }
}

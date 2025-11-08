<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\ClassType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassTypeAdminController extends Controller
{
    use ResolvesOrganization;

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $types = ClassType::where('organization_id', $organization->id)->orderBy('name')->get();

        return response()->json(['data' => $types]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'name' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'default_capacity' => ['nullable', 'integer'],
        ]);

        $type = ClassType::create(array_merge($data, ['organization_id' => $organization->id]));

        return response()->json(['data' => $type], 201);
    }

    public function update(Request $request, ClassType $classType): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($classType->organization_id === $organization->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'description' => ['nullable', 'string'],
            'default_capacity' => ['nullable', 'integer'],
        ]);

        $classType->fill($data);
        $classType->save();

        return response()->json(['data' => $classType]);
    }

    public function destroy(Request $request, ClassType $classType)
    : JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($classType->organization_id === $organization->id, 404);
        $classType->delete();

        return response()->json([], 204);
    }
}

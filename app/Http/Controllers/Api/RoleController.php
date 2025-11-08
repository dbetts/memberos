<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Services\Security\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly RoleService $roleService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $roles = $this->roleService->listRoles($organization);

        return response()->json(['data' => $roles]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        if ($role->organization_id && $role->organization_id !== $organization->id) {
            abort(404);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'permissions' => ['required', 'array'],
        ]);

        if ($role->organization_id === null && $role->is_system) {
            $role = Role::create([
                'organization_id' => $organization->id,
                'name' => $data['name'] ?? $role->name,
                'slug' => $role->slug,
                'permissions' => $data['permissions'],
                'created_by' => optional($request->user())->id,
            ]);
        } else {
            $role = $this->roleService->updateRole($role, $data + [
                'updated_by' => optional($request->user())->id,
            ]);
        }

        return response()->json(['data' => $role]);
    }
}

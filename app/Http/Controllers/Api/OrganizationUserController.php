<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Role;
use App\Models\RoleAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OrganizationUserController extends Controller
{
    use ResolvesOrganization;

    private array $supportedRoles = [
        'admin' => 'Administrator',
        'coach' => 'Coach',
        'support' => 'Support',
    ];

    private array $defaultPermissions = [
        'admin' => [
            'billing.manage',
            'members.manage',
            'communications.manage',
            'workouts.manage',
            'analytics.manage',
        ],
        'coach' => [
            'workouts.manage',
            'members.read',
            'communications.read',
        ],
        'support' => [
            'members.read',
            'billing.read',
            'communications.read',
        ],
    ];

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $users = User::with(['roleAssignments.role'])
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                $role = optional($user->roleAssignments->first())->role;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_slug' => $role?->slug ?? $user->default_role,
                    'role_name' => $role?->name ?? Str::title(str_replace('_', ' ', $user->default_role ?? '')),
                    'last_login_at' => $user->last_login_at,
                    'is_primary_owner' => $user->default_role === 'owner',
                ];
            });

        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role_slug' => ['required', 'string', 'in:' . implode(',', array_keys($this->supportedRoles))],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $tempPassword = Str::random(14);

        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => Hash::make($tempPassword),
            'organization_id' => $organization->id,
            'default_role' => $data['role_slug'],
            'phone' => $data['phone'] ?? null,
        ]);

        $role = $this->ensureRoleExists($organization, $data['role_slug']);

        RoleAssignment::updateOrCreate(
            ['user_id' => $user->id],
            ['role_id' => $role->id, 'is_primary' => true]
        );

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_slug' => $role->slug,
                    'role_name' => $role->name,
                ],
                'temp_password' => $tempPassword,
            ],
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($user->organization_id === $organization->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role_slug' => ['sometimes', 'string', 'in:' . implode(',', array_keys($this->supportedRoles))],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user->fill(Arr::only($data, ['name', 'email', 'phone']));

        if (isset($data['role_slug'])) {
            $role = $this->ensureRoleExists($organization, $data['role_slug']);
            $user->default_role = $data['role_slug'];

            RoleAssignment::updateOrCreate(
                ['user_id' => $user->id],
                ['role_id' => $role->id, 'is_primary' => true]
            );
        }

        $user->save();

        return response()->json(['data' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role_slug' => $user->default_role,
            'role_name' => $this->supportedRoles[$user->default_role] ?? Str::title($user->default_role ?? ''),
        ]]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->id === $user->id, 422, 'You cannot remove your own account.');
        abort_if($user->default_role === 'owner', 422, 'The primary owner cannot be removed.');

        $organization = $this->resolveOrganization($request);
        abort_unless($user->organization_id === $organization->id, 404);

        $user->roleAssignments()->delete();
        $user->delete();

        return response()->json(['status' => 'ok']);
    }

    protected function ensureRoleExists(Organization $organization, string $slug): Role
    {
        return Role::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'slug' => $slug,
            ],
            [
                'name' => $this->supportedRoles[$slug] ?? Str::title($slug),
                'permissions' => $this->defaultPermissions[$slug] ?? [],
                'is_system' => false,
            ]
        );
    }
}

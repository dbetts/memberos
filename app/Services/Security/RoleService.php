<?php

namespace App\Services\Security;

use App\Models\Organization;
use App\Models\Role;
use Illuminate\Support\Arr;

class RoleService
{
    public function listRoles(Organization $organization)
    {
        return Role::query()
            ->where(function ($query) use ($organization): void {
                $query->whereNull('organization_id')
                    ->orWhere('organization_id', $organization->id);
            })
            ->orderBy('name')
            ->get();
    }

    public function updateRole(Role $role, array $payload): Role
    {
        $role->fill([
            'name' => Arr::get($payload, 'name', $role->name),
            'permissions' => Arr::get($payload, 'permissions', $role->permissions),
        ]);

        $role->save();

        return $role;
    }

    public function bootstrapSystemRoles(?int $adminUserId = null): void
    {
        $defaults = [
            ['slug' => 'org_admin', 'name' => 'Org Admin'],
            ['slug' => 'location_manager', 'name' => 'Location Manager'],
            ['slug' => 'coach', 'name' => 'Coach'],
            ['slug' => 'front_desk', 'name' => 'Front Desk'],
            ['slug' => 'marketer', 'name' => 'Marketer'],
            ['slug' => 'readonly', 'name' => 'Read Only'],
        ];

        foreach ($defaults as $roleDef) {
            Role::firstOrCreate(
                ['slug' => $roleDef['slug'], 'organization_id' => null],
                [
                    'name' => $roleDef['name'],
                    'is_system' => true,
                    'permissions' => [],
                    'created_by' => $adminUserId,
                ]
            );
        }
    }
}

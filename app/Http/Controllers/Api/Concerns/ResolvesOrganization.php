<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Organization;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

trait ResolvesOrganization
{
    protected function resolveOrganization(Request $request): Organization
    {
        $user = Auth::user();
        $requestedId = $request->header('X-Organization-Id') ?? $request->query('organization_id');

        if ($requestedId) {
            $organization = Organization::find($requestedId);
            if ($organization) {
                $userOrgId = $user?->organization_id;
                $isMasterWithoutOrg = $user && ! $userOrgId && ($user->is_master ?? false);

                if (! $userOrgId || $userOrgId === $organization->id || $isMasterWithoutOrg) {
                    return $organization;
                }
            }
        }

        if ($user && $user->organization_id) {
            $organization = Organization::find($user->organization_id);
            if ($organization) {
                return $organization;
            }
        }

        throw (new ModelNotFoundException())->setModel(Organization::class);
    }
}

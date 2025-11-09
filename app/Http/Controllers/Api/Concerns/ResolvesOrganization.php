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
        $organizationId = $request->header('X-Organization-Id') ?? $request->query('organization_id');

        if ($organizationId) {
            $organization = Organization::find($organizationId);
            if ($organization) {
                return $organization;
            }
        }

        $user = Auth::user();
        if ($user && $user->organization_id) {
            $organization = Organization::find($user->organization_id);
            if ($organization) {
                return $organization;
            }
        }

        throw (new ModelNotFoundException())->setModel(Organization::class);
    }
}

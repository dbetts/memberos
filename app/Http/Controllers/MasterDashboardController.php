<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\PaidSignup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MasterDashboardController extends Controller
{
    public function __invoke(Request $request): View
    {
        $user = $request->user();
        abort_unless($user && $user->is_master, 403);

        $organizations = Organization::withCount(['locations', 'membershipPlans', 'members'])
            ->with(['users' => function ($query): void {
                $query->select(['id', 'name', 'email', 'organization_id', 'default_role'])
                    ->where('is_master', false)
                    ->orderByRaw("CASE WHEN default_role = 'owner' THEN 0 ELSE 1 END")
                    ->orderBy('name');
            }])
            ->orderBy('name')
            ->get()
            ->map(function (Organization $organization) {
                $lastSignup = PaidSignup::where('organization_id', $organization->id)
                    ->latest()
                    ->first();
                $primaryAdmin = $organization->users->first();

                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'subdomain' => $organization->subdomain,
                    'custom_domain' => $organization->custom_domain,
                    'locations' => $organization->locations_count,
                    'plans' => $organization->membership_plans_count,
                    'members' => $organization->members_count,
                    'last_payment' => optional($lastSignup)->payment_reference,
                    'created_at' => $organization->created_at,
                    'primary_admin' => $primaryAdmin ? [
                        'id' => $primaryAdmin->id,
                        'name' => $primaryAdmin->name,
                        'email' => $primaryAdmin->email,
                    ] : null,
                ];
            });

        return view('master-dashboard', [
            'organizations' => $organizations,
            'user' => $user,
        ]);
    }
}

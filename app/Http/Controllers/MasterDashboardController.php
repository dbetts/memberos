<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\PaidSignup;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MasterDashboardController extends Controller
{
    public function __invoke(Request $request): View
    {
        $user = $request->user();
        abort_unless($user && $user->is_master, 403);

        $organizations = Organization::withCount(['locations', 'membershipPlans', 'members'])
            ->get()
            ->map(function (Organization $organization) {
                $lastSignup = PaidSignup::where('organization_id', $organization->id)
                    ->latest()
                    ->first();

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
                ];
            });

        return view('master-dashboard', [
            'organizations' => $organizations,
            'user' => $user,
        ]);
    }
}

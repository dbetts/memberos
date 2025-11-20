<?php

namespace App\Providers;

use App\Models\Organization;
use App\Models\User;
use App\Support\Concerns\TransformsAuthenticatedData;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    use TransformsAuthenticatedData;

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        View::composer('app', function ($view): void {
            $user = Auth::user();
            $brandingModel = null;
            $bootstrapData = null;

            if ($user) {
                $organization = null;
                if ($user->organization_id) {
                    $organization = Organization::query()
                        ->select([
                            'id',
                            'name',
                            'subdomain',
                            'custom_domain',
                            'primary_color',
                            'accent_color',
                            'branding_overrides',
                            'logo_path',
                            'support_email',
                        ])
                        ->find($user->organization_id);
                    $brandingModel = $organization;
                }

                $impersonation = null;
                if (session()->has('impersonated_by')) {
                    $impersonation = [
                        'active' => true,
                        'master_name' => optional(User::find(session()->get('impersonated_by')))->name,
                        'organization_id' => session()->get('impersonating_org_id'),
                    ];
                }

                $bootstrapData = [
                    'user' => $this->transformUser($user),
                    'branding' => $organization ? $this->transformBranding($organization) : null,
                    'impersonation' => $impersonation,
                ];
            }

            $view->with([
                'branding' => $brandingModel,
                'bootstrapData' => $bootstrapData,
            ]);
        });
    }
}

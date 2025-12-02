<?php

namespace App\Support\Concerns;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

trait TransformsAuthenticatedData
{
    protected function transformUser(User $user): array
    {
        $profile = $user->profile ?? [];
        $address = $profile['address'] ?? [];

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'organization_id' => $user->organization_id,
            'is_master' => (bool) $user->is_master,
            'address' => [
                'line1' => $address['line1'] ?? '',
                'line2' => $address['line2'] ?? '',
                'city' => $address['city'] ?? '',
                'state' => $address['state'] ?? '',
                'postal' => $address['postal'] ?? '',
                'country' => $address['country'] ?? '',
            ],
        ];
    }

    protected function transformBranding(Organization $organization): array
    {
        return [
            'id' => $organization->id,
            'name' => $organization->name,
            'subdomain' => $organization->subdomain,
            'custom_domain' => $organization->custom_domain,
            'support_email' => $organization->support_email,
            'primary_color' => $organization->primary_color,
            'accent_color' => $organization->accent_color,
            'logo_url' => $organization->logo_path ? Storage::disk('public')->url($organization->logo_path) : null,
            'branding_overrides' => $organization->branding_overrides,
        ];
    }
}

<?php

namespace App\Services\Onboarding;

use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WorkspaceProvisioner
{
    /**
     * @param  array<string, mixed>  $data
     * @return array{organization: Organization, user: User, temp_password: string}
     */
    public function provision(array $data, ?UploadedFile $logo = null): array
    {
        return DB::transaction(function () use ($data, $logo) {
            $password = $data['admin_password'] ?? Str::password(12);

            $organization = Organization::create([
                'name' => $data['organization_name'],
                'slug' => $this->generateSlug($data['organization_name']),
                'primary_timezone' => $data['timezone'],
                'subdomain' => $data['subdomain'] ?? null,
                'custom_domain' => $data['custom_domain'] ?? null,
                'support_email' => $data['support_email'] ?? $data['admin_email'],
                'primary_color' => $data['primary_color'] ?? '#4b79ff',
                'accent_color' => $data['accent_color'] ?? '#2f63ff',
                'smtp_settings' => $this->formatSmtpSettings($data['smtp'] ?? []),
            ]);

            if ($logo) {
                $organization->logo_path = $logo->store('logos', 'public');
                $organization->save();
            }

            $location = Location::create([
                'organization_id' => $organization->id,
                'name' => "{$organization->name} HQ",
                'timezone' => $organization->primary_timezone,
                'is_active' => true,
            ]);

            $user = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => $password,
                'organization_id' => $organization->id,
                'primary_location_id' => $location->id,
                'timezone' => $organization->primary_timezone,
                'default_role' => 'owner',
            ]);

            return [
                'organization' => $organization,
                'user' => $user,
                'temp_password' => $password,
            ];
        });
    }

    public function generateSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (Organization::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /**
     * @param  array<string, mixed>  $smtp
     */
    public function formatSmtpSettings(array $smtp): ?array
    {
        if (empty($smtp['host'])) {
            return null;
        }

        return [
            'host' => $smtp['host'],
            'port' => $smtp['port'] ?? 587,
            'username' => $smtp['username'] ?? null,
            'password' => isset($smtp['password']) ? encrypt($smtp['password']) : null,
            'encryption' => $smtp['encryption'] ?? 'tls',
            'from_email' => $smtp['from_email'] ?? null,
            'from_name' => $smtp['from_name'] ?? null,
        ];
    }
}

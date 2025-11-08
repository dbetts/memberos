<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OrganizationBrandingController extends Controller
{
    use ResolvesOrganization;

    public function show(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        return response()->json(['data' => $this->transform($organization)]);
    }

    public function updateBranding(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'support_email' => ['nullable', 'email'],
            'primary_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}){1,2}$/'],
            'accent_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}){1,2}$/'],
            'branding_overrides' => ['nullable', 'array'],
        ]);

        $organization->fill([
            'name' => $data['name'] ?? $organization->name,
            'support_email' => $data['support_email'] ?? $organization->support_email,
            'primary_color' => $data['primary_color'] ?? $organization->primary_color,
            'accent_color' => $data['accent_color'] ?? $organization->accent_color,
            'branding_overrides' => $data['branding_overrides'] ?? $organization->branding_overrides,
        ])->save();

        return response()->json(['data' => $this->transform($organization)]);
    }

    public function updateDomain(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'subdomain' => ['nullable', 'alpha_dash', 'max:50', 'unique:organizations,subdomain,' . $organization->id],
            'custom_domain' => ['nullable', 'string', 'max:255', 'unique:organizations,custom_domain,' . $organization->id],
        ]);

        $organization->fill($data)->save();

        return response()->json(['data' => $this->transform($organization)]);
    }

    public function updateSmtp(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'encryption' => ['nullable', 'in:none,ssl,tls,starttls'],
            'from_email' => ['nullable', 'email'],
            'from_name' => ['nullable', 'string', 'max:255'],
        ]);

        $smtp = [
            'host' => $data['host'],
            'port' => $data['port'],
            'username' => $data['username'] ?? null,
            'encryption' => $data['encryption'] ?? 'tls',
            'from_email' => $data['from_email'] ?? $organization->support_email,
            'from_name' => $data['from_name'] ?? $organization->name,
        ];

        if (isset($data['password']) && $data['password'] !== '') {
            $smtp['password'] = encrypt($data['password']);
        } elseif ($organization->smtp_settings['password'] ?? false) {
            $smtp['password'] = $organization->smtp_settings['password'];
        }

        $organization->smtp_settings = $smtp;
        $organization->save();

        return response()->json(['data' => $this->transform($organization)]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'logo' => ['required', 'image', 'max:4096'],
        ]);

        if ($organization->logo_path) {
            Storage::disk('public')->delete($organization->logo_path);
        }

        $organization->logo_path = $request->file('logo')->store('logos', 'public');
        $organization->save();

        return response()->json(['data' => $this->transform($organization)]);
    }

    private function transform(Organization $organization): array
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
            'smtp' => $this->smtpSummary($organization),
        ];
    }

    private function smtpSummary(Organization $organization): ?array
    {
        if (! $organization->smtp_settings) {
            return null;
        }

        return [
            'host' => $organization->smtp_settings['host'] ?? null,
            'port' => $organization->smtp_settings['port'] ?? null,
            'username' => $organization->smtp_settings['username'] ?? null,
            'encryption' => $organization->smtp_settings['encryption'] ?? null,
            'from_email' => $organization->smtp_settings['from_email'] ?? null,
            'from_name' => $organization->smtp_settings['from_name'] ?? null,
            'has_password' => ! empty($organization->smtp_settings['password']),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Onboarding\WorkspaceProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OnboardingController extends Controller
{
    public function __construct(private readonly WorkspaceProvisioner $provisioner)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'organization_name' => ['required', 'string', 'max:255'],
            'timezone' => ['required', 'string', 'max:64'],
            'subdomain' => ['required', 'alpha_dash', 'max:50', 'unique:organizations,subdomain'],
            'custom_domain' => ['nullable', 'string', 'max:255', 'unique:organizations,custom_domain'],
            'support_email' => ['nullable', 'email'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'admin_password' => ['nullable', 'string', 'min:8'],
            'primary_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}){1,2}$/'],
            'accent_color' => ['nullable', 'regex:/^#([0-9a-fA-F]{3}){1,2}$/'],
            'smtp.host' => ['nullable', 'string', 'max:255'],
            'smtp.port' => ['nullable', 'integer'],
            'smtp.username' => ['nullable', 'string', 'max:255'],
            'smtp.password' => ['nullable', 'string', 'max:255'],
            'smtp.encryption' => ['nullable', 'in:none,ssl,tls,starttls'],
            'smtp.from_email' => ['nullable', 'email'],
            'smtp.from_name' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ]);

        $payload = $this->provisioner->provision($data, $request->file('logo'));

        $logoUrl = $payload['organization']->logo_path
            ? Storage::disk('public')->url($payload['organization']->logo_path)
            : null;

        return response()->json([
            'data' => [
                'organization_id' => $payload['organization']->id,
                'admin_user_id' => $payload['user']->id,
                'dashboard_url' => url('/'),
                'logo_url' => $logoUrl,
                'temp_password' => $payload['temp_password'],
            ],
        ], 201);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AuthenticatedUserController extends Controller
{
    use ResolvesOrganization;

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        return response()->json(['data' => $this->transformUser($user)]);
    }

    public function bootstrap(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $branding = null;

        try {
            $organization = $this->resolveOrganization($request);
            $branding = $this->transformBranding($organization);
        } catch (ModelNotFoundException $exception) {
            if ($user->organization_id) {
                throw $exception;
            }
        }

        return response()->json([
            'data' => [
                'user' => $this->transformUser($user),
                'branding' => $branding,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'address.line1' => ['nullable', 'string', 'max:255'],
            'address.line2' => ['nullable', 'string', 'max:255'],
            'address.city' => ['nullable', 'string', 'max:120'],
            'address.state' => ['nullable', 'string', 'max:120'],
            'address.postal' => ['nullable', 'string', 'max:40'],
            'address.country' => ['nullable', 'string', 'max:120'],
        ]);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $profile = $user->profile ?? [];
        $profile['address'] = [
            'line1' => $data['address']['line1'] ?? ($profile['address']['line1'] ?? null),
            'line2' => $data['address']['line2'] ?? ($profile['address']['line2'] ?? null),
            'city' => $data['address']['city'] ?? ($profile['address']['city'] ?? null),
            'state' => $data['address']['state'] ?? ($profile['address']['state'] ?? null),
            'postal' => $data['address']['postal'] ?? ($profile['address']['postal'] ?? null),
            'country' => $data['address']['country'] ?? ($profile['address']['country'] ?? null),
        ];

        $user->profile = $profile;
        $user->save();

        return response()->json(['data' => $this->transformUser($user)]);
    }

    protected function transformUser($user): array
    {
        $profile = $user->profile ?? [];
        $address = $profile['address'] ?? [];

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'organization_id' => $user->organization_id,
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

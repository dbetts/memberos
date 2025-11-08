<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserMfaMethod;
use App\Services\Security\MfaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MfaPreferenceController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly MfaService $mfaService)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        $preferences = $this->mfaService->getPreferences($user);

        return response()->json(['data' => $preferences]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        $data = $request->validate([
            'preference' => ['required', 'in:sms,totp'],
            'enabled' => ['required', 'boolean'],
        ]);

        $user = $this->mfaService->updatePreference($user, $data);

        return response()->json(['data' => $this->mfaService->getPreferences($user)]);
    }

    public function storeMethod(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        $data = $request->validate([
            'type' => ['required', 'in:sms,totp'],
            'label' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'secret' => ['nullable', 'string'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $method = $this->mfaService->addMethod($user, $data);

        return response()->json(['data' => $method], 201);
    }

    public function destroyMethod(Request $request, UserMfaMethod $method)
    : JsonResponse
    {
        $user = $this->resolveUser($request);
        $this->mfaService->removeMethod($user, $method);

        return response()->json([], 204);
    }

    protected function resolveUser(Request $request): User
    {
        $organization = $this->resolveOrganization($request);

        $user = $request->user();
        if (! $user) {
            $user = User::query()
                ->where('organization_id', $organization->id)
                ->first();
        }

        if (! $user || $user->organization_id !== $organization->id) {
            abort(403, 'No authenticated user available for MFA management.');
        }

        return $user;
    }
}

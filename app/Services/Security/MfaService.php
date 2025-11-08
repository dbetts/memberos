<?php

namespace App\Services\Security;

use App\Models\User;
use App\Models\UserMfaMethod;
use Illuminate\Support\Arr;
use RuntimeException;

class MfaService
{
    public function getPreferences(User $user): array
    {
        return [
            'preference' => $user->mfa_preference,
            'enabled' => (bool) $user->mfa_enabled,
            'methods' => $user->mfaMethods()->get()->map(function (UserMfaMethod $method) {
                return [
                    'id' => $method->id,
                    'type' => $method->type,
                    'label' => $method->label,
                    'is_primary' => $method->is_primary,
                    'verified_at' => optional($method->verified_at)->toIso8601String(),
                ];
            }),
        ];
    }

    public function updatePreference(User $user, array $payload): User
    {
        $preference = Arr::get($payload, 'preference', $user->mfa_preference);

        if (! in_array($preference, ['sms', 'totp'], true)) {
            throw new RuntimeException('Unsupported MFA preference.');
        }

        $user->mfa_preference = $preference;
        $user->mfa_enabled = Arr::get($payload, 'enabled', $user->mfa_enabled);
        $user->save();

        return $user;
    }

    public function addMethod(User $user, array $payload): UserMfaMethod
    {
        $type = Arr::get($payload, 'type');
        if (! in_array($type, ['sms', 'totp'], true)) {
            throw new RuntimeException('Unsupported MFA method type.');
        }

        $method = new UserMfaMethod([
            'type' => $type,
            'label' => Arr::get($payload, 'label'),
            'is_primary' => Arr::get($payload, 'is_primary', false),
        ]);

        if ($type === 'sms') {
            $phone = preg_replace('/[^\d+]/', '', Arr::get($payload, 'phone', ''));
            if (! $phone) {
                throw new RuntimeException('Phone number required for SMS MFA.');
            }

            $method->phone_encrypted = encrypt($phone);
            $method->phone_hash = hash('sha256', $phone);
        } else {
            $secret = Arr::get($payload, 'secret') ?? $this->generateTotpSecret();
            $method->secret_encrypted = encrypt($secret);
        }

        $user->mfaMethods()->where('is_primary', true)->update(['is_primary' => false]);
        $method->is_primary = Arr::get($payload, 'is_primary', true);

        $user->mfaMethods()->save($method);

        $user->mfa_enabled = true;
        $user->save();

        return $method;
    }

    public function removeMethod(User $user, UserMfaMethod $method): void
    {
        if ($method->user_id !== $user->id) {
            throw new RuntimeException('Cannot modify another user\'s MFA method.');
        }

        $method->delete();

        if ($user->mfaMethods()->count() === 0) {
            $user->mfa_enabled = false;
            $user->save();
        }
    }

    protected function generateTotpSecret(): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';

        for ($i = 0; $i < 32; $i++) {
            $secret .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return $secret;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaidSignup;
use App\Services\Onboarding\WorkspaceProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Stripe\StripeClient;

class CheckoutController extends Controller
{
    public function __construct(private readonly WorkspaceProvisioner $provisioner)
    {
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'organization_name' => ['required', 'string', 'max:255'],
            'timezone' => ['required', 'string', 'max:64'],
            'subdomain' => ['required', 'alpha_dash', 'max:50', 'unique:organizations,subdomain'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'card_number' => ['required', 'string'],
            'card_exp_month' => ['required', 'integer', 'between:1,12'],
            'card_exp_year' => ['required', 'integer', 'min:' . date('Y')],
            'card_cvc' => ['required', 'string', 'max:4'],
        ]);

        $priceCents = (int) (config('services.stripe.subscription_amount_cents') ?? 9995);
        $stripeSecret = config('services.stripe.secret');

        if (! $stripeSecret) {
            abort(500, 'Stripe secret key not configured.');
        }

        $stripe = new StripeClient($stripeSecret);

        $paymentIntent = $stripe->paymentIntents->create([
            'amount' => $priceCents,
            'currency' => 'usd',
            'payment_method_data' => [
                'type' => 'card',
                'card' => [
                    'number' => $data['card_number'],
                    'exp_month' => $data['card_exp_month'],
                    'exp_year' => $data['card_exp_year'],
                    'cvc' => $data['card_cvc'],
                ],
                'billing_details' => [
                    'email' => $data['admin_email'],
                    'name' => $data['admin_name'],
                ],
            ],
            'confirm' => true,
            'description' => 'FitFlow Subscription',
            'metadata' => [
                'organization_name' => $data['organization_name'],
                'admin_email' => $data['admin_email'],
            ],
        ]);

        if ($paymentIntent->status !== 'succeeded') {
            abort(500, 'Unable to capture payment.');
        }

        $provisionData = [
            'organization_name' => $data['organization_name'],
            'timezone' => $data['timezone'],
            'subdomain' => $data['subdomain'],
            'custom_domain' => null,
            'support_email' => $data['admin_email'],
            'admin_name' => $data['admin_name'],
            'admin_email' => $data['admin_email'],
            'admin_password' => Str::password(12),
            'primary_color' => '#4b79ff',
            'accent_color' => '#2f63ff',
            'smtp' => [],
        ];

        $payload = $this->provisioner->provision($provisionData);

        $token = Str::uuid()->toString();

        PaidSignup::create([
            'organization_id' => $payload['organization']->id,
            'user_id' => $payload['user']->id,
            'admin_email' => $data['admin_email'],
            'admin_name' => $data['admin_name'],
            'token' => $token,
            'payment_reference' => $paymentIntent->id,
            'temp_password_encrypted' => encrypt($payload['temp_password']),
            'status' => 'active',
        ]);

        return response()->json([
            'data' => [
                'invite_token' => $token,
                'next_url' => url('/login'),
                'login_email' => $data['admin_email'],
                'temp_password' => $payload['temp_password'],
                'dashboard_url' => url('/app'),
            ],
        ], 201);
    }
}

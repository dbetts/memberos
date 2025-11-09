<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\OnboardingController;

Route::prefix('v1')->group(function (): void {
    Route::get('health', static fn () => ['status' => 'ok']);

    Route::post('checkout/subscribe', [CheckoutController::class, 'subscribe']);

    Route::post('onboarding/signup', [OnboardingController::class, 'store']);

    Route::prefix('external')->middleware('auth.api')->group(function (): void {
        Route::get('members', [\App\Http\Controllers\Api\MemberController::class, 'index']);
        Route::get('capacity/schedule', [\App\Http\Controllers\Api\CapacityController::class, 'schedule']);
    });
});

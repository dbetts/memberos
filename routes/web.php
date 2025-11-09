<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\Api\AuthenticatedUserController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\MemberAuthController;
use App\Http\Controllers\MemberPortalController;
use App\Http\Controllers\PublicLeadCaptureController;
use Illuminate\Support\Facades\Route;

Route::get('/', LandingController::class);
Route::view('/app/{any?}', 'app')->where('any', '.*');
Route::get('/subscribe', fn () => view('subscribe', ['monthly_price' => number_format(99.95, 2)]));

Route::get('/lead/capture', [PublicLeadCaptureController::class, 'form']);
Route::get('/public/leads', [PublicLeadCaptureController::class, 'form']);
Route::post('/public/leads', [PublicLeadCaptureController::class, 'store']);
Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('admin.login');
Route::post('/login', [AdminAuthController::class, 'login'])->name('admin.login.attempt');
Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');
Route::get('/member/login', fn () => redirect('/login'))->name('member.login');
Route::post('/member/login', [AdminAuthController::class, 'login'])->name('member.login.attempt');
Route::post('/member/logout', [MemberAuthController::class, 'logout'])->name('member.logout');

Route::middleware('auth:member')->group(function (): void {
    Route::get('/member/portal', [MemberPortalController::class, 'show']);
    Route::post('/member/portal/goals', [MemberPortalController::class, 'storeGoal']);
});

Route::middleware('auth')->group(function (): void {
    Route::get('/master-control', \App\Http\Controllers\MasterDashboardController::class)->name('master.dashboard');
});

require __DIR__.'/tenant.php';

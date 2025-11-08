<?php

use App\Http\Controllers\PublicLeadCaptureController;
use App\Http\Controllers\MemberPortalController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

Route::get('/lead/capture', [PublicLeadCaptureController::class, 'form']);
Route::post('/public/leads', [PublicLeadCaptureController::class, 'store']);
Route::get('/member/portal', [MemberPortalController::class, 'show']);
Route::post('/member/portal/goals', [MemberPortalController::class, 'storeGoal']);

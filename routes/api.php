<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\RetentionController;
use App\Http\Controllers\Api\FreezeRequestController;
use App\Http\Controllers\Api\PlaybookController;
use App\Http\Controllers\Api\MessageTemplateController;
use App\Http\Controllers\Api\CommunicationPolicyController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\IdentityReviewController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\MfaPreferenceController;
use App\Http\Controllers\Api\CapacityController;
use App\Http\Controllers\Api\CadenceController;
use App\Http\Controllers\Api\LeadTaskController;
use App\Http\Controllers\Api\LeadController as CrmLeadController;
use App\Http\Controllers\Api\CrmAnalyticsController;
use App\Http\Controllers\Api\AdminLocationController;
use App\Http\Controllers\Api\ClassTypeAdminController;
use App\Http\Controllers\Api\StaffProfileController;
use App\Http\Controllers\Api\ObservabilityController;
use App\Http\Controllers\Api\CoachController;
use App\Http\Controllers\Api\CommunicationComplianceController;
use App\Http\Controllers\Api\GraphqlController;
use App\Http\Controllers\Api\LeadConversionController;

Route::prefix('v1')->group(function (): void {
    Route::get('health', static fn () => ['status' => 'ok']);

    Route::get('dashboard/kpis', [DashboardController::class, 'index']);
    Route::get('dashboard/filters', [DashboardController::class, 'filters']);

    Route::get('members', [MemberController::class, 'index']);
    Route::get('members/{member}', [MemberController::class, 'show']);
    Route::put('members/{member}/consents', [MemberController::class, 'updateConsents']);
    Route::put('members/{member}/quiet-hours', [MemberController::class, 'updateQuietHours']);

    Route::get('retention/heatmap', [RetentionController::class, 'heatmap']);
    Route::get('retention/at-risk', [RetentionController::class, 'atRiskRoster']);
    Route::post('retention/recalculate', [RetentionController::class, 'recalculate']);
    Route::get('retention/settings', [RetentionController::class, 'showSettings']);
    Route::put('retention/settings', [RetentionController::class, 'updateSettings']);
    Route::put('retention/engine-settings', [RetentionController::class, 'updateEngineSettings']);
    Route::post('retention/win-back/run', [RetentionController::class, 'triggerWinBack']);
    Route::get('retention/freeze-requests', [FreezeRequestController::class, 'index']);
    Route::post('retention/members/{member}/freeze-requests', [FreezeRequestController::class, 'store']);
    Route::put('retention/freeze-requests/{freezeRequest}', [FreezeRequestController::class, 'update']);

    Route::apiResource('playbooks', PlaybookController::class);
    Route::post('playbooks/{playbook}/activate', [PlaybookController::class, 'activate']);
    Route::post('playbooks/{playbook}/pause', [PlaybookController::class, 'pause']);

    Route::get('templates', [MessageTemplateController::class, 'index']);
    Route::post('templates', [MessageTemplateController::class, 'store']);
    Route::get('templates/{template}', [MessageTemplateController::class, 'show']);
    Route::put('templates/{template}', [MessageTemplateController::class, 'update']);
    Route::delete('templates/{template}', [MessageTemplateController::class, 'destroy']);
    Route::post('templates/{template}/restore', [MessageTemplateController::class, 'restore']);

    Route::get('communications/policy', [CommunicationPolicyController::class, 'show']);
    Route::put('communications/policy', [CommunicationPolicyController::class, 'update']);

    Route::get('identity/merge-candidates', [IdentityReviewController::class, 'index']);
    Route::post('identity/merge-candidates/{candidate}/resolve', [IdentityReviewController::class, 'resolve']);

    Route::post('integrations/mindbody/import', [IntegrationController::class, 'importMindbody']);
    Route::get('integrations', [IntegrationController::class, 'index']);

    Route::get('roles', [RoleController::class, 'index']);
    Route::put('roles/{role}', [RoleController::class, 'update']);

    Route::get('security/mfa/preferences', [MfaPreferenceController::class, 'show']);
    Route::put('security/mfa/preferences', [MfaPreferenceController::class, 'update']);
    Route::post('security/mfa/methods', [MfaPreferenceController::class, 'storeMethod']);
    Route::delete('security/mfa/methods/{method}', [MfaPreferenceController::class, 'destroyMethod']);

    Route::get('capacity/schedule', [CapacityController::class, 'schedule']);
    Route::post('capacity/bookings/{booking}/confirm', [CapacityController::class, 'confirmBooking']);
    Route::post('capacity/waitlist/backfill', [CapacityController::class, 'backfill']);

    Route::get('crm/leads', [CrmLeadController::class, 'index']);
    Route::post('crm/leads', [CrmLeadController::class, 'store']);
    Route::get('crm/cadences', [CadenceController::class, 'index']);
    Route::post('crm/leads/{lead}/tasks', [LeadTaskController::class, 'store']);
    Route::put('crm/tasks/{task}', [LeadTaskController::class, 'update']);
    Route::post('crm/leads/{lead}/convert', LeadConversionController::class);
    Route::get('crm/analytics', CrmAnalyticsController::class);

    Route::get('admin/locations', [AdminLocationController::class, 'index']);
    Route::put('admin/locations/{location}', [AdminLocationController::class, 'update']);
    Route::get('admin/class-types', [ClassTypeAdminController::class, 'index']);
    Route::post('admin/class-types', [ClassTypeAdminController::class, 'store']);
    Route::put('admin/class-types/{classType}', [ClassTypeAdminController::class, 'update']);
    Route::delete('admin/class-types/{classType}', [ClassTypeAdminController::class, 'destroy']);
    Route::get('admin/staff', [StaffProfileController::class, 'index']);
    Route::post('admin/staff', [StaffProfileController::class, 'store']);
    Route::put('admin/staff/{staffProfile}', [StaffProfileController::class, 'update']);

    Route::get('coach/roster', [CoachController::class, 'roster']);
    Route::post('coach/nudges', [CoachController::class, 'nudge']);
    Route::post('coach/members/{member}/outcomes', [CoachController::class, 'storeOutcome']);

    Route::get('observability/events', [ObservabilityController::class, 'events']);
    Route::post('observability/events', [ObservabilityController::class, 'storeEvent']);
    Route::get('observability/release-notes', [ObservabilityController::class, 'releaseNotes']);
    Route::post('observability/release-notes', [ObservabilityController::class, 'storeReleaseNote']);
    Route::get('observability/slo', [ObservabilityController::class, 'slo']);

    Route::get('compliance/domains', [CommunicationComplianceController::class, 'domains']);
    Route::post('compliance/domains', [CommunicationComplianceController::class, 'storeDomain']);
    Route::get('compliance/sms', [CommunicationComplianceController::class, 'smsRegistrations']);
    Route::post('compliance/sms', [CommunicationComplianceController::class, 'storeSmsRegistration']);

    Route::post('graphql', GraphqlController::class);

    Route::prefix('external')->middleware('auth.api')->group(function (): void {
        Route::get('members', [MemberController::class, 'index']);
        Route::get('capacity/schedule', [CapacityController::class, 'schedule']);
    });
});

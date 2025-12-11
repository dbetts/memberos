<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminLocationController;
use App\Http\Controllers\Api\CadenceController;
use App\Http\Controllers\Api\CapacityController;
use App\Http\Controllers\Api\ClassTypeAdminController;
use App\Http\Controllers\Api\CoachController;
use App\Http\Controllers\Api\CommunicationComplianceController;
use App\Http\Controllers\Api\CommunicationPolicyController;
use App\Http\Controllers\Api\CrmAnalyticsController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CrmOverviewController;
use App\Http\Controllers\Api\CoachOverviewController;
use App\Http\Controllers\Api\PlaybooksOverviewController;
use App\Http\Controllers\Api\FreezeRequestController;
use App\Http\Controllers\Api\GraphqlController;
use App\Http\Controllers\Api\IdentityReviewController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\LeadController as CrmLeadController;
use App\Http\Controllers\Api\LeadConversionController;
use App\Http\Controllers\Api\LeadTaskController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MemberImportController;
use App\Http\Controllers\Api\MessageTemplateController;
use App\Http\Controllers\Api\MfaPreferenceController;
use App\Http\Controllers\Api\ObservabilityController;
use App\Http\Controllers\Api\OrganizationBrandingController;
use App\Http\Controllers\Api\PlaybookController;
use App\Http\Controllers\Api\RetentionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StaffProfileController;
use App\Http\Controllers\Api\AuthenticatedUserController;
use App\Http\Controllers\Api\SettingsOverviewController;
use App\Http\Controllers\Api\OrganizationUserController;
use App\Http\Controllers\Api\WorkoutProgramController;
use App\Http\Controllers\Api\WorkoutItemController;
use App\Http\Controllers\Api\ExerciseController;

Route::middleware(['auth'])->prefix('api/v1')->group(function (): void {
    Route::get('auth/me', [AuthenticatedUserController::class, 'show']);
    Route::put('auth/me', [AuthenticatedUserController::class, 'update']);
    Route::get('auth/bootstrap', [AuthenticatedUserController::class, 'bootstrap']);

    Route::get('dashboard/kpis', [DashboardController::class, 'index']);
    Route::get('dashboard/filters', [DashboardController::class, 'filters']);
    Route::get('dashboard/overview', [DashboardController::class, 'overview']);

    Route::get('members', [MemberController::class, 'index']);
    Route::get('members/{member}', [MemberController::class, 'show']);
    Route::post('members', [MemberController::class, 'store']);
    Route::put('members/{member}/consents', [MemberController::class, 'updateConsents']);
    Route::put('members/{member}/quiet-hours', [MemberController::class, 'updateQuietHours']);

    Route::get('organizations/branding', [OrganizationBrandingController::class, 'show']);
    Route::put('organizations/branding', [OrganizationBrandingController::class, 'updateBranding']);
    Route::put('organizations/domain', [OrganizationBrandingController::class, 'updateDomain']);
    Route::put('organizations/smtp', [OrganizationBrandingController::class, 'updateSmtp']);
    Route::post('organizations/branding/logo', [OrganizationBrandingController::class, 'uploadLogo']);
    Route::post('imports/members', [MemberImportController::class, 'store']);

    Route::get('retention/heatmap', [RetentionController::class, 'heatmap']);
    Route::get('retention/at-risk', [RetentionController::class, 'atRiskRoster']);
    Route::get('retention/overview', [RetentionController::class, 'overview']);
    Route::post('retention/recalculate', [RetentionController::class, 'recalculate']);
    Route::get('retention/settings', [RetentionController::class, 'showSettings']);
    Route::put('retention/settings', [RetentionController::class, 'updateSettings']);
    Route::put('retention/engine-settings', [RetentionController::class, 'updateEngineSettings']);
    Route::post('retention/win-back/run', [RetentionController::class, 'triggerWinBack']);
    Route::get('retention/freeze-requests', [FreezeRequestController::class, 'index']);
    Route::post('retention/members/{member}/freeze-requests', [FreezeRequestController::class, 'store']);
    Route::put('retention/freeze-requests/{freezeRequest}', [FreezeRequestController::class, 'update']);

    Route::get('playbooks/overview', PlaybooksOverviewController::class);
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
    Route::get('capacity/overview', [CapacityController::class, 'overview']);
    Route::post('capacity/bookings/{booking}/confirm', [CapacityController::class, 'confirmBooking']);
    Route::post('capacity/waitlist/backfill', [CapacityController::class, 'backfill']);

    Route::get('crm/leads', [CrmLeadController::class, 'index']);
    Route::post('crm/leads', [CrmLeadController::class, 'store']);
    Route::get('crm/cadences', [CadenceController::class, 'index']);
    Route::post('crm/leads/{lead}/tasks', [LeadTaskController::class, 'store']);
    Route::put('crm/tasks/{task}', [LeadTaskController::class, 'update']);
    Route::post('crm/leads/{lead}/convert', LeadConversionController::class);
    Route::get('crm/analytics', CrmAnalyticsController::class);
    Route::get('crm/overview', CrmOverviewController::class);

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
    Route::get('coach/overview', CoachOverviewController::class);

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

    Route::get('settings/overview', SettingsOverviewController::class);

    Route::prefix('workouts')->group(function (): void {
        Route::get('exercises', [ExerciseController::class, 'index']);
        Route::post('exercises', [ExerciseController::class, 'store']);
        Route::get('programs', [WorkoutProgramController::class, 'index']);
        Route::post('programs', [WorkoutProgramController::class, 'store']);
        Route::get('programs/{program}/calendar', [WorkoutProgramController::class, 'calendar']);

        Route::post('{workout}/items', [WorkoutItemController::class, 'store']);
        Route::get('items/{item}', [WorkoutItemController::class, 'show']);
        Route::put('items/{item}', [WorkoutItemController::class, 'update']);
        Route::delete('items/{item}', [WorkoutItemController::class, 'destroy']);
        Route::post('items/{item}/move', [WorkoutItemController::class, 'move']);
        Route::post('items/{item}/duplicate', [WorkoutItemController::class, 'duplicate']);
    });

    Route::prefix('team')->group(function (): void {
        Route::get('users', [OrganizationUserController::class, 'index']);
        Route::post('users', [OrganizationUserController::class, 'store']);
        Route::put('users/{user}', [OrganizationUserController::class, 'update']);
        Route::delete('users/{user}', [OrganizationUserController::class, 'destroy']);
    });
});

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\ClassType;
use App\Models\CommunicationDomain;
use App\Models\Integration;
use App\Models\Location;
use App\Models\ObservabilityEvent;
use App\Models\PerformanceSample;
use App\Models\ReleaseNote;
use App\Models\SmsRegistration;
use App\Models\StaffProfile;
use App\Services\Communications\CommunicationPolicyService;
use App\Services\Security\MfaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsOverviewController extends Controller
{
    use ResolvesOrganization;

    public function __construct(
        private readonly CommunicationPolicyService $policyService,
        private readonly MfaService $mfaService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $user = $request->user();

        $integrations = Integration::where('organization_id', $organization->id)->get();
        $policy = $this->policyService->getPolicy($organization);
        $mfa = $user ? $this->mfaService->getPreferences($user) : null;
        $locations = Location::where('organization_id', $organization->id)->get();
        $classTypes = ClassType::where('organization_id', $organization->id)->get();
        $staff = StaffProfile::with('user')->where('organization_id', $organization->id)->get();

        $events = ObservabilityEvent::where('organization_id', $organization->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $releaseNotes = ReleaseNote::where('organization_id', $organization->id)
            ->orderByDesc('published_at')
            ->limit(20)
            ->get();

        $windowStart = now()->subDay();
        $apiSamples = PerformanceSample::where('organization_id', $organization->id)
            ->where('channel', 'api')
            ->where('recorded_at', '>=', $windowStart)
            ->pluck('duration_ms');

        $webSamples = PerformanceSample::where('organization_id', $organization->id)
            ->where('channel', 'web')
            ->where('recorded_at', '>=', $windowStart)
            ->pluck('duration_ms');

        $p95 = static function ($samples) {
            if ($samples->isEmpty()) {
                return null;
            }

            $sorted = $samples->sort()->values();
            $index = (int) floor(($sorted->count() - 1) * 0.95);

            return $sorted->get($index);
        };

        $apiP95 = $p95($apiSamples);
        $webP95 = $p95($webSamples);

        $heartbeats = ObservabilityEvent::where('organization_id', $organization->id)
            ->where('event_type', 'uptime.heartbeat')
            ->where('created_at', '>=', $windowStart)
            ->count();

        $expected = (int) (24 * 60 / 5);
        $uptime = $expected > 0 ? min(100, round(($heartbeats / $expected) * 100, 2)) : null;

        $domains = CommunicationDomain::where('organization_id', $organization->id)->get();
        $sms = SmsRegistration::where('organization_id', $organization->id)->get();

        return response()->json([
            'data' => [
                'organization_id' => $organization->id,
                'integrations' => $integrations,
                'policy' => $policy,
                'mfa' => $mfa,
                'locations' => $locations,
                'class_types' => $classTypes,
                'staff' => $staff,
                'events' => $events,
                'release_notes' => $releaseNotes,
                'slo' => [
                    'api_p95_ms' => $apiP95,
                    'web_p95_ms' => $webP95,
                    'uptime_percent' => $uptime,
                ],
                'domains' => $domains,
                'sms_registrations' => $sms,
            ],
        ]);
    }
}

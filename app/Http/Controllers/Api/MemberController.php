<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Services\Retention\RiskScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly RiskScoringService $riskScoringService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $perPage = min(100, max(1, (int) $request->query('per_page', 25)));

        $query = Member::query()
            ->with('riskScore')
            ->where('organization_id', $organization->id)
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search): void {
                $q->where('first_name', 'like', "%$search%")
                    ->orWhere('last_name', 'like', "%$search%")
                    ->orWhere('status', 'like', "%$search%")
                    ->orWhere('preferred_contact_channel', 'like', "%$search%");
            });
        }

        if ($band = $request->query('risk_band')) {
            $settings = $this->riskScoringService->resolveSettings($organization->id);
            $bands = $settings['risk_bands'] ?? [];
            if (isset($bands[$band])) {
                $min = $bands[$band]['min'] ?? 0;
                $max = $bands[$band]['max'] ?? 100;
                $query->whereHas('riskScore', function ($q) use ($min, $max): void {
                    $q->whereBetween('score', [$min, $max]);
                });
            }
        }

        $members = $query->paginate($perPage);

        return response()->json($members);
    }

    public function show(Request $request, Member $member): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($member->organization_id === $organization->id, 404);

        $member->load(['riskScore', 'homeLocation', 'membershipPlan']);

        return response()->json(['data' => $member]);
    }

    public function updateConsents(Request $request, Member $member): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($member->organization_id === $organization->id, 404);

        $data = $request->validate([
            'sms' => ['required', 'boolean'],
            'email' => ['required', 'boolean'],
            'push' => ['nullable', 'boolean'],
            'wearables' => ['nullable', 'boolean'],
        ]);

        $member->consents = array_merge($member->consents ?? [], $data);
        $member->save();

        return response()->json(['data' => $member->consents]);
    }

    public function updateQuietHours(Request $request, Member $member): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($member->organization_id === $organization->id, 404);

        $data = $request->validate([
            'quiet_hours_start' => ['required', 'date_format:H:i'],
            'quiet_hours_end' => ['required', 'date_format:H:i'],
            'daily_send_cap' => ['nullable', 'integer', 'min:0'],
            'weekly_send_cap' => ['nullable', 'integer', 'min:0'],
        ]);

        $member->quiet_hours_start = $data['quiet_hours_start'];
        $member->quiet_hours_end = $data['quiet_hours_end'];
        $member->quiet_hours_override = true;

        if (isset($data['daily_send_cap'])) {
            $member->daily_send_cap = $data['daily_send_cap'];
        }

        if (isset($data['weekly_send_cap'])) {
            $member->weekly_send_cap = $data['weekly_send_cap'];
        }

        $member->save();

        return response()->json(['data' => $member->only([
            'quiet_hours_start',
            'quiet_hours_end',
            'daily_send_cap',
            'weekly_send_cap',
        ])]);
    }
}

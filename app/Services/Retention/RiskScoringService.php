<?php

namespace App\Services\Retention;

use App\Models\Booking;
use App\Models\Member;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\RetentionSetting;
use App\Models\RiskScore;
use App\Models\RiskScoreSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class RiskScoringService
{
    public function calculateForOrganization(Organization $organization): Collection
    {
        $settings = $this->resolveSettings($organization->id);

        $members = Member::query()
            ->with(['homeLocation'])
            ->where('organization_id', $organization->id)
            ->get();

        $now = CarbonImmutable::now();

        return $members->map(function (Member $member) use ($settings, $now, $organization) {
            $result = $this->scoreMember($member, $settings, $now);

            $riskScore = RiskScore::updateOrCreate(
                [
                    'member_id' => $member->id,
                ],
                [
                    'organization_id' => $organization->id,
                    'score' => $result['score'],
                    'reasons' => $result['reasons'],
                    'calculated_at' => $now,
                ],
            );

            RiskScoreSnapshot::create([
                'risk_score_id' => $riskScore->id,
                'score' => $result['score'],
                'reasons' => $result['reasons'],
                'calculated_at' => $now,
            ]);

            return $riskScore->fresh();
        });
    }

    public function scoreMember(Member $member, array $settings, CarbonImmutable $now = null): array
    {
        $now ??= CarbonImmutable::now();

        $score = 0;
        $reasons = [];

        $streakBreakDays = Arr::get($settings, 'streak_break_days', 7);
        $missedCountThreshold = Arr::get($settings, 'missed_bookings_threshold.count', 2);
        $missedWindowDays = Arr::get($settings, 'missed_bookings_threshold.window_days', 14);
        $billingOverdueDays = Arr::get($settings, 'billing_risk.overdue_days', 7);

        $lastCheckIn = $member->checkIns()->orderByDesc('checked_in_at')->value('checked_in_at');
        $daysSinceCheckIn = $lastCheckIn ? CarbonImmutable::parse($lastCheckIn)->diffInDays($now) : null;

        if ($daysSinceCheckIn === null || $daysSinceCheckIn >= $streakBreakDays) {
            $score += ($daysSinceCheckIn ?? $streakBreakDays) >= ($streakBreakDays * 2) ? 40 : 25;
            $reasons[] = [
                'code' => 'streak_break',
                'detail' => $daysSinceCheckIn === null
                    ? 'No recorded check-ins'
                    : sprintf('No check-in in %d days', $daysSinceCheckIn),
            ];
        }

        $missedBookingsCount = Booking::query()
            ->where('member_id', $member->id)
            ->where('organization_id', $member->organization_id)
            ->whereIn('status', ['no_show', 'canceled'])
            ->where('created_at', '>=', $now->subDays($missedWindowDays))
            ->count();

        if ($missedBookingsCount >= $missedCountThreshold) {
            $score += 20;
            $reasons[] = [
                'code' => 'missed_bookings',
                'detail' => sprintf('%d missed bookings in last %d days', $missedBookingsCount, $missedWindowDays),
            ];
        }

        $overduePayment = Payment::query()
            ->where('member_id', $member->id)
            ->where('organization_id', $member->organization_id)
            ->where(function ($query) use ($now, $billingOverdueDays): void {
                $query->where('status', 'overdue')
                    ->orWhere(function ($q) use ($now, $billingOverdueDays): void {
                        $q->where('status', 'pending')
                            ->whereDate('due_on', '<=', $now->subDays($billingOverdueDays)->toDateString());
                    });
            })
            ->exists();

        if ($overduePayment) {
            $score += 25;
            $reasons[] = [
                'code' => 'billing_risk',
                'detail' => 'Payment overdue beyond grace window',
            ];
        }

        $score = min(100, max(0, $score));

        return [
            'score' => $score,
            'reasons' => $reasons,
        ];
    }

    public function resolveRiskBand(int $score, array $settings): string
    {
        $bands = Arr::get($settings, 'risk_bands', []);

        foreach ($bands as $label => $range) {
            $min = Arr::get($range, 'min', 0);
            $max = Arr::get($range, 'max', 100);

            if ($score >= $min && $score <= $max) {
                return $label;
            }
        }

        return 'unknown';
    }

    public function resolveSettings(string $organizationId): array
    {
        $settings = RetentionSetting::query()
            ->where('organization_id', $organizationId)
            ->get()
            ->pluck('value', 'key')
            ->toArray();

        return array_replace_recursive(
            Config::get('retention', []),
            $settings,
        );
    }

    public function buildHeatmap(Organization $organization): array
    {
        $settings = $this->resolveSettings($organization->id);

        $riskScores = RiskScore::query()
            ->where('organization_id', $organization->id)
            ->get(['score']);

        $bands = [
            'low' => 0,
            'medium' => 0,
            'high' => 0,
            'critical' => 0,
        ];

        foreach ($riskScores as $riskScore) {
            $band = $this->resolveRiskBand((int) $riskScore->score, $settings);
            if (! isset($bands[$band])) {
                $bands[$band] = 0;
            }
            $bands[$band]++;
        }

        return $bands;
    }

    public function fetchAtRiskMembers(Organization $organization, int $limit = 50): Collection
    {
        return RiskScore::query()
            ->with('member')
            ->where('organization_id', $organization->id)
            ->orderByDesc('score')
            ->limit($limit)
            ->get();
    }
}

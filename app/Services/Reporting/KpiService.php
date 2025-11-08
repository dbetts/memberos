<?php

namespace App\Services\Reporting;

use App\Models\Booking;
use App\Models\ClassSession;
use App\Models\KpiSnapshot;
use App\Models\Lead;
use App\Models\Location;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\Organization;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class KpiService
{
    public function getDashboardKpis(Organization $organization, array $filters = []): Collection
    {
        $snapshot = KpiSnapshot::query()
            ->where('organization_id', $organization->id)
            ->orderByDesc('period_end')
            ->first();

        if ($snapshot) {
            return collect([
                [
                    'key' => 'monthly_churn',
                    'label' => 'Monthly Churn',
                    'value' => $this->formatPercent($snapshot->monthly_churn_rate),
                ],
                [
                    'key' => 'class_fill',
                    'label' => 'Class Fill Rate',
                    'value' => $this->formatPercent($snapshot->class_fill_percent),
                ],
                [
                    'key' => 'no_show',
                    'label' => 'No-Show Rate',
                    'value' => $this->formatPercent($snapshot->no_show_percent),
                ],
                [
                    'key' => 'mrr',
                    'label' => 'MRR',
                    'value' => $this->formatCurrency($snapshot->mrr_cents),
                ],
            ]);
        }

        return $this->calculateLive($organization, $filters);
    }

    protected function calculateLive(Organization $organization, array $filters = []): Collection
    {
        $now = CarbonImmutable::now();
        $thirtyDaysAgo = $now->subDays(30);
        $ninetyDaysAgo = $now->subDays(90);

        $memberQuery = Member::query()->where('organization_id', $organization->id);
        $this->applyMemberFilters($memberQuery, $filters);

        $activeMembers = (clone $memberQuery)->where('status', 'active')->count();

        $canceledThisMonth = (clone $memberQuery)
            ->where('status', 'canceled')
            ->where('updated_at', '>=', $thirtyDaysAgo)
            ->count();

        $monthlyChurn = $activeMembers > 0 ? ($canceledThisMonth / $activeMembers) * 100 : 0;

        $survivorsQuery = (clone $memberQuery)->where('joined_on', '<=', $ninetyDaysAgo->toDateString());

        $survivors = $survivorsQuery->count();

        $survivorsActive = (clone $survivorsQuery)->where('status', 'active')->count();

        $ninetyDaySurvival = $survivors > 0 ? ($survivorsActive / $survivors) * 100 : 0;

        $futureBookingsQuery = Booking::query()
            ->where('bookings.organization_id', $organization->id)
            ->join('class_sessions', 'bookings.class_session_id', '=', 'class_sessions.id')
            ->whereBetween('class_sessions.starts_at', [$now, $now->addDays(7)]);

        $this->applySessionFilters($futureBookingsQuery, $filters);

        $futureBookings = $futureBookingsQuery->with('session')->get();

        $fillTotals = $futureBookings->groupBy('class_session_id')->map(function ($bookings) {
            $session = $bookings->first()->session;
            $capacity = $session?->capacity ?? 0;
            $booked = $bookings->filter(function (Booking $booking) {
                return in_array($booking->status, ['booked', 'attended'], true);
            })->count();

            return [
                'booked' => $booked,
                'capacity' => $capacity,
            ];
        });

        $averageFill = $fillTotals->count() > 0
            ? $fillTotals->avg(fn ($row) => $row['capacity'] > 0 ? ($row['booked'] / $row['capacity']) * 100 : 0)
            : 0;

        $recentBookingsQuery = Booking::query()
            ->where('bookings.organization_id', $organization->id)
            ->where('bookings.created_at', '>=', $thirtyDaysAgo)
            ->join('class_sessions', 'bookings.class_session_id', '=', 'class_sessions.id');

        $this->applySessionFilters($recentBookingsQuery, $filters);

        $recentBookings = $recentBookingsQuery->get();

        $noShowRate = $recentBookings->count() > 0
            ? ($recentBookings->where('status', 'no_show')->count() / $recentBookings->count()) * 100
            : 0;

        $waitlistPromotions = $recentBookings->filter(fn (Booking $booking) => $booking->waitlist_position !== null && $booking->status === 'booked')->count();
        $waitlistRequests = $recentBookings->whereNotNull('waitlist_position')->count();
        $waitlistConversion = $waitlistRequests > 0 ? ($waitlistPromotions / $waitlistRequests) * 100 : 0;

        $leadQuery = Lead::query()->where('organization_id', $organization->id);
        $this->applyLeadFilters($leadQuery, $filters);

        $leads = $leadQuery->get();

        $leadToTrial = $leads->count() > 0
            ? ($leads->where('stage', 'trial')->count() / $leads->count()) * 100
            : 0;

        $trialToJoin = $leads->where('stage', 'trial')->count() > 0
            ? ($leads->filter(fn (Lead $lead) => $lead->stage === 'close' || $lead->converted_member_id !== null)->count() / max(1, $leads->where('stage', 'trial')->count())) * 100
            : 0;

        $planQuery = MembershipPlan::query()
            ->where('organization_id', $organization->id)
            ->where('is_active', true);

        if (! empty($filters['plan_id'])) {
            $planQuery->where('id', $filters['plan_id']);
        }

        $planRevenue = $planQuery->sum('price_cents');

        $mrr = $planRevenue;

        return collect([
            [
                'key' => 'monthly_churn',
                'label' => 'Monthly Churn',
                'value' => $this->formatPercent($monthlyChurn),
            ],
            [
                'key' => 'ninety_day_survival',
                'label' => '90-Day Survival',
                'value' => $this->formatPercent($ninetyDaySurvival),
            ],
            [
                'key' => 'class_fill',
                'label' => 'Class Fill Rate',
                'value' => $this->formatPercent($averageFill),
            ],
            [
                'key' => 'no_show',
                'label' => 'No-Show Rate',
                'value' => $this->formatPercent($noShowRate),
            ],
            [
                'key' => 'waitlist_conversion',
                'label' => 'Waitlist Conversion',
                'value' => $this->formatPercent($waitlistConversion),
            ],
            [
                'key' => 'lead_to_trial',
                'label' => 'Lead → Trial',
                'value' => $this->formatPercent($leadToTrial),
            ],
            [
                'key' => 'trial_to_join',
                'label' => 'Trial → Join',
                'value' => $this->formatPercent($trialToJoin),
            ],
            [
                'key' => 'mrr',
                'label' => 'MRR',
                'value' => $this->formatCurrency($mrr),
            ],
        ]);
    }

    protected function formatPercent(?float $value): string
    {
        return sprintf('%0.1f%%', $value ?? 0);
    }

    protected function formatCurrency(?int $cents): string
    {
        if ($cents === null) {
            return '$0';
        }

        return '$' . number_format($cents / 100, 2);
    }

    public function availableFilters(Organization $organization): array
    {
        $locations = Location::where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $classTypes = ClassSession::query()
            ->where('organization_id', $organization->id)
            ->distinct()
            ->pluck('class_type');

        $instructors = User::query()
            ->whereIn('id', ClassSession::where('organization_id', $organization->id)->pluck('instructor_id')->filter())
            ->get(['id', 'name']);

        $plans = MembershipPlan::where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $sources = Lead::where('organization_id', $organization->id)
            ->whereNotNull('source')
            ->distinct()
            ->pluck('source');

        $joinMonths = Member::where('organization_id', $organization->id)
            ->whereNotNull('joined_on')
            ->orderBy('joined_on', 'desc')
            ->get()
            ->pluck('joined_on')
            ->map(fn ($date) => CarbonImmutable::parse($date)->format('Y-m'))
            ->unique()
            ->values();

        return [
            'locations' => $locations,
            'class_types' => $classTypes,
            'instructors' => $instructors,
            'plans' => $plans,
            'sources' => $sources,
            'join_months' => $joinMonths,
        ];
    }

    protected function applyMemberFilters(Builder $query, array $filters): void
    {
        $query->when($filters['location_id'] ?? null, fn ($q, $location) => $q->where('home_location_id', $location));
        $query->when($filters['plan_id'] ?? null, fn ($q, $plan) => $q->where('membership_plan_id', $plan));
        $query->when($filters['join_month'] ?? null, function ($q, $month): void {
            if (strlen($month) === 7) {
                [$year, $mon] = explode('-', $month);
                $q->whereYear('joined_on', $year)->whereMonth('joined_on', $mon);
            }
        });
    }

    protected function applySessionFilters(Builder $query, array $filters): void
    {
        $query->when($filters['location_id'] ?? null, fn ($q, $location) => $q->where('class_sessions.location_id', $location));
        $query->when($filters['class_type'] ?? null, fn ($q, $classType) => $q->where('class_sessions.class_type', $classType));
        $query->when($filters['instructor_id'] ?? null, fn ($q, $instructor) => $q->where('class_sessions.instructor_id', $instructor));
    }

    protected function applyLeadFilters(Builder $query, array $filters): void
    {
        $query->when($filters['source'] ?? null, fn ($q, $source) => $q->where('source', $source));
    }
}

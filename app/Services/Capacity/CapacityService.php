<?php

namespace App\Services\Capacity;

use App\Models\Booking;
use App\Models\ClassSession;
use App\Models\Organization;
use App\Models\WaitlistEntry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class CapacityService
{
    public function schedule(Organization $organization, ?string $range = null): array
    {
        $windowStart = CarbonImmutable::now();
        $windowEnd = match ($range) {
            '7d' => $windowStart->addDays(7),
            '30d' => $windowStart->addDays(30),
            default => $windowStart->addDays(3),
        };

        $sessions = ClassSession::with(['location'])
            ->where('organization_id', $organization->id)
            ->whereBetween('starts_at', [$windowStart, $windowEnd])
            ->orderBy('starts_at')
            ->get();

        $sessionIds = $sessions->pluck('id');

        $bookings = Booking::whereIn('class_session_id', $sessionIds)->get()->groupBy('class_session_id');
        $waitlists = WaitlistEntry::whereIn('class_session_id', $sessionIds)->get()->groupBy('class_session_id');

        return $sessions->map(function (ClassSession $session) use ($bookings, $waitlists): array {
            $sessionBookings = $bookings->get($session->id, collect());
            $sessionWaitlist = $waitlists->get($session->id, collect());
            $booked = $sessionBookings->whereIn('status', ['booked', 'attended'])->count();
            $noShowProbability = $this->estimateNoShowProbability($sessionBookings);

            return [
                'id' => $session->id,
                'class_type' => $session->class_type,
                'starts_at' => $session->starts_at,
                'ends_at' => $session->ends_at,
                'capacity' => $session->capacity,
                'booked' => $booked,
                'waitlist' => $sessionWaitlist->count(),
                'fill_percent' => $session->capacity ? round(($booked / $session->capacity) * 100, 1) : 0,
                'predicted_no_show_percent' => $noShowProbability,
                'location' => $session->location?->name,
                'deposit_required' => $this->requiresDeposit($session, $noShowProbability),
                'deposit_amount_cents' => $session->location?->deposit_policy['amount_cents'] ?? 0,
            ];
        })->values()->all();
    }

    protected function estimateNoShowProbability(Collection $bookings): float
    {
        if ($bookings->isEmpty()) {
            return 8.0;
        }

        $noShows = $bookings->where('status', 'no_show')->count();
        return round(($noShows / max(1, $bookings->count())) * 100, 1);
    }

    protected function requiresDeposit(ClassSession $session, float $predictedNoShow): bool
    {
        $policy = $session->location?->deposit_policy ?? null;
        if (! is_array($policy) || empty($policy['enabled'])) {
            return false;
        }

        $threshold = $policy['threshold_percent'] ?? 40;
        return $predictedNoShow >= $threshold;
    }
}

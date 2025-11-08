<?php

namespace App\Services\Capacity;

use App\Models\Booking;
use App\Models\ClassSession;
use App\Models\Organization;
use App\Models\WaitlistEntry;
use Illuminate\Support\Collection;

class AutoBackfillService
{
    public function promote(Organization $organization, string $classSessionId): array
    {
        $waitlist = WaitlistEntry::where('organization_id', $organization->id)
            ->where('class_session_id', $classSessionId)
            ->where('status', 'waiting')
            ->orderBy('position')
            ->get();

        $promoted = [];
        $session = ClassSession::with('location')->find($classSessionId);
        $depositPolicy = $session?->location?->deposit_policy ?? [];

        /** @var WaitlistEntry $entry */
        foreach ($waitlist as $entry) {
            $deposit = (! empty($depositPolicy['enabled']) && ($depositPolicy['threshold_percent'] ?? 40) <= 100)
                ? ($depositPolicy['amount_cents'] ?? 0)
                : null;

            $booking = Booking::create([
                'organization_id' => $organization->id,
                'member_id' => $entry->member_id,
                'class_session_id' => $classSessionId,
                'status' => 'booked',
                'booked_at' => now(),
                'source' => 'auto_backfill',
                'deposit_cents' => $deposit,
                'metadata' => ['deposit_required' => (bool) $deposit],
            ]);

            $entry->status = 'promoted';
            $entry->promoted_at = now();
            $entry->save();

            $promoted[] = [
                'waitlist_entry_id' => $entry->id,
                'booking_id' => $booking->id,
            ];
        }

        return $promoted;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\Capacity\AutoBackfillService;
use App\Services\Capacity\CapacityService;
use App\Services\Webhooks\WebhookDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CapacityController extends Controller
{
    use ResolvesOrganization;

    public function __construct(
        private readonly CapacityService $capacityService,
        private readonly AutoBackfillService $autoBackfillService,
        private readonly WebhookDispatcher $webhookDispatcher
    ) {
    }

    public function schedule(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $range = $request->query('range', '3d');
        $data = $this->capacityService->schedule($organization, $range);

        return response()->json(['data' => $data]);
    }

    public function confirmBooking(Request $request, Booking $booking): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($booking->organization_id === $organization->id, 404);

        $booking->status = 'attended';
        $booking->confirmed_at = now();
        if ($booking->deposit_cents) {
            $booking->metadata = array_merge($booking->metadata ?? [], [
                'deposit_refunded_at' => now()->toIso8601String(),
            ]);
            $booking->deposit_cents = 0;
        }
        $booking->save();

        $this->webhookDispatcher->dispatch('booking.confirmed', [
            'booking_id' => $booking->id,
            'member_id' => $booking->member_id,
        ]);

        return response()->json(['data' => $booking]);
    }

    public function backfill(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'class_session_id' => ['required', 'uuid'],
        ]);

        $promoted = $this->autoBackfillService->promote($organization, $data['class_session_id']);

        $this->webhookDispatcher->dispatch('auto_backfill.promoted', [
            'class_session_id' => $data['class_session_id'],
            'promoted' => $promoted,
        ]);

        return response()->json(['data' => $promoted]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\MemberAccount;
use App\Models\MemberGoalEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

class MemberPortalController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:member');
    }

    public function show(Request $request): View
    {
        /** @var MemberAccount $account */
        $account = $request->user('member');
        $member = $account->member()->with(['booking.session', 'membershipPlan', 'organization'])->firstOrFail();
        $organization = $member->organization;

        $goals = MemberGoalEntry::where('member_id', optional($member)->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return view('member-portal', [
            'member' => $member,
            'goals' => $goals,
            'branding' => [
                'logo_url' => $organization?->logo_path ? Storage::disk('public')->url($organization->logo_path) : null,
                'primary_color' => $organization?->primary_color ?? '#4b79ff',
                'accent_color' => $organization?->accent_color ?? '#2f63ff',
                'support_email' => $organization?->support_email,
                'organization_name' => $organization?->name ?? 'FitFlow Studio',
            ],
        ]);
    }

    public function storeGoal(Request $request): RedirectResponse
    {
        /** @var MemberAccount $account */
        $account = $request->user('member');
        $member = $account->member()->firstOrFail();

        $data = $request->validate([
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'target_date' => ['nullable', 'date'],
        ]);

        MemberGoalEntry::create([
            'member_id' => $member->id,
            'type' => 'goal',
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'target_date' => $data['target_date'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Goal saved');
    }
}

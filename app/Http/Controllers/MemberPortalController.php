<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MemberGoalEntry;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MemberPortalController extends Controller
{
    public function show(Request $request): View
    {
        $organization = Organization::first();
        $member = Member::with(['booking', 'membershipPlan'])
            ->where('organization_id', optional($organization)->id)
            ->first();

        $goals = MemberGoalEntry::where('member_id', optional($member)->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return view('member-portal', [
            'member' => $member,
            'goals' => $goals,
        ]);
    }

    public function storeGoal(Request $request): RedirectResponse
    {
        $organization = Organization::first();
        $member = Member::where('organization_id', optional($organization)->id)->firstOrFail();

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

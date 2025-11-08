<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Message;
use App\Models\MemberGoalEntry;
use App\Services\Coach\RosterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly RosterService $rosterService)
    {
    }

    public function roster(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $classType = $request->query('class_type');
        $data = $this->rosterService->roster($organization, $classType);

        return response()->json(['data' => $data]);
    }

    public function nudge(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'member_ids' => ['required', 'array'],
            'member_ids.*' => ['uuid'],
            'channel' => ['required', 'in:sms,email'],
            'body' => ['required', 'string'],
        ]);

        $members = Member::whereIn('id', $data['member_ids'])->get();

        foreach ($members as $member) {
            Message::create([
                'organization_id' => $organization->id,
                'member_id' => $member->id,
                'channel' => $data['channel'],
                'body_text' => $data['body'],
                'status' => 'queued',
                'queued_at' => now(),
            ]);
        }

        return response()->json(['data' => ['sent' => $members->count()]]);
    }

    public function storeOutcome(Request $request, Member $member): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($member->organization_id === $organization->id, 404);

        $data = $request->validate([
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string'],
        ]);

        $entry = MemberGoalEntry::create([
            'member_id' => $member->id,
            'type' => $data['type'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json(['data' => $entry], 201);
    }
}

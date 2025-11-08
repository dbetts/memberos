<?php

namespace App\Services\Data;

use App\Models\Member;
use App\Models\MemberMergeCandidate;
use App\Models\Organization;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class IdentityResolutionService
{
    public function queueCandidatesForOrganization(Organization $organization): void
    {
        $members = Member::query()
            ->where('organization_id', $organization->id)
            ->get(['id', 'email_hash', 'phone_hash']);

        $groupedByEmail = $members->filter(fn (Member $member) => $member->email_hash)->groupBy('email_hash');
        $groupedByPhone = $members->filter(fn (Member $member) => $member->phone_hash)->groupBy('phone_hash');

        DB::transaction(function () use ($organization, $groupedByEmail, $groupedByPhone): void {
            $this->createCandidatesFromGroups($organization, $groupedByEmail, 'email');
            $this->createCandidatesFromGroups($organization, $groupedByPhone, 'phone');
        });
    }

    public function listPending(Organization $organization): Collection
    {
        return MemberMergeCandidate::query()
            ->with(['primaryMember', 'conflictingMember'])
            ->where('organization_id', $organization->id)
            ->where('status', 'pending')
            ->get();
    }

    public function resolve(MemberMergeCandidate $candidate, string $status, ?string $notes = null): MemberMergeCandidate
    {
        $candidate->status = $status;
        $candidate->resolution_notes = $notes;
        $candidate->resolved_at = now();
        $candidate->save();

        return $candidate;
    }

    protected function createCandidatesFromGroups(Organization $organization, Collection $groups, string $signal): void
    {
        foreach ($groups as $hash => $members) {
            if ($members->count() < 2) {
                continue;
            }

            $primary = $members->first();

            $members->slice(1)->each(function (Member $duplicate) use ($organization, $primary, $signal, $hash): void {
                MemberMergeCandidate::firstOrCreate(
                    [
                        'organization_id' => $organization->id,
                        'primary_member_id' => $primary->id,
                        'conflicting_member_id' => $duplicate->id,
                    ],
                    [
                        'confidence_score' => 90,
                        'status' => 'pending',
                        'signals' => [
                            'type' => $signal,
                            'hash' => $hash,
                        ],
                    ]
                );
            });
        }
    }
}

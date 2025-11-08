<?php

namespace App\Services\Integrations;

use App\Models\ClassSession;
use App\Models\DataImportBatch;
use App\Models\Integration;
use App\Models\Location;
use App\Models\Member;
use App\Models\MemberExternalId;
use App\Models\MembershipPlan;
use App\Models\Organization;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MindbodyImportService
{
    public function importMockPayload(Organization $organization, array $payload, ?int $userId = null): DataImportBatch
    {
        $batch = DataImportBatch::create([
            'organization_id' => $organization->id,
            'source' => 'mindbody_mock',
            'import_type' => 'full',
            'status' => 'processing',
            'summary' => null,
            'initiated_by' => $userId,
            'started_at' => now(),
        ]);

        $summary = [
            'members_created' => 0,
            'members_updated' => 0,
            'sessions_created' => 0,
        ];

        DB::beginTransaction();

        try {
            foreach (Arr::get($payload, 'locations', []) as $locationPayload) {
                $this->upsertLocation($organization, $locationPayload);
            }

            foreach (Arr::get($payload, 'plans', []) as $planPayload) {
                $this->upsertPlan($organization, $planPayload);
            }

            foreach (Arr::get($payload, 'members', []) as $memberPayload) {
                [$member, $created] = $this->upsertMember($organization, $memberPayload);
                $summary[$created ? 'members_created' : 'members_updated']++;

                if ($externalId = Arr::get($memberPayload, 'external_id')) {
                    MemberExternalId::updateOrCreate(
                        [
                            'member_id' => $member->id,
                            'provider' => 'mindbody',
                            'external_id' => $externalId,
                        ],
                        [
                            'payload' => $memberPayload,
                        ]
                    );
                }
            }

            foreach (Arr::get($payload, 'sessions', []) as $sessionPayload) {
                $this->upsertSession($organization, $sessionPayload);
                $summary['sessions_created']++;
            }

            DB::commit();

            Integration::updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'provider' => 'mindbody',
                ],
                [
                    'status' => 'connected',
                    'configuration' => ['mode' => 'mock'],
                    'sync_cursors' => [
                        'members' => now()->toIso8601String(),
                        'sessions' => now()->toIso8601String(),
                    ],
                    'last_synced_at' => now(),
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]
            );

            $batch->status = 'completed';
            $batch->summary = $summary;
            $batch->completed_at = now();
            $batch->save();
        } catch (\Throwable $throwable) {
            DB::rollBack();

            $batch->status = 'failed';
            $batch->summary = [
                'message' => $throwable->getMessage(),
            ];
            $batch->completed_at = now();
            $batch->save();

            throw $throwable;
        }

        return $batch->fresh();
    }

    protected function upsertLocation(Organization $organization, array $payload): Location
    {
        return Location::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'name' => Arr::get($payload, 'name'),
            ],
            [
                'timezone' => Arr::get($payload, 'timezone', $organization->primary_timezone),
                'room_capacity' => Arr::get($payload, 'capacity'),
                'address_line1' => Arr::get($payload, 'address_line1'),
                'address_line2' => Arr::get($payload, 'address_line2'),
                'city' => Arr::get($payload, 'city'),
                'state' => Arr::get($payload, 'state'),
                'postal_code' => Arr::get($payload, 'postal_code'),
                'country' => Arr::get($payload, 'country'),
                'metadata' => Arr::except($payload, ['name', 'timezone', 'capacity', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country']),
            ]
        );
    }

    protected function upsertPlan(Organization $organization, array $payload): MembershipPlan
    {
        return MembershipPlan::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'external_id' => Arr::get($payload, 'external_id'),
            ],
            [
                'name' => Arr::get($payload, 'name'),
                'description' => Arr::get($payload, 'description'),
                'billing_interval' => Arr::get($payload, 'billing_interval', 'monthly'),
                'price_cents' => Arr::get($payload, 'price_cents', 0),
                'currency' => Arr::get($payload, 'currency', 'USD'),
                'is_active' => Arr::get($payload, 'is_active', true),
                'metadata' => Arr::except($payload, ['name', 'description', 'billing_interval', 'price_cents', 'currency', 'is_active', 'external_id']),
            ]
        );
    }

    protected function upsertMember(Organization $organization, array $payload): array
    {
        $email = Str::lower(trim((string) Arr::get($payload, 'email')));
        $phone = preg_replace('/[^\d+]/', '', (string) Arr::get($payload, 'phone'));

        $emailHash = $email ? hash('sha256', $email) : null;
        $phoneHash = $phone ? hash('sha256', $phone) : null;

        $plan = null;
        if ($externalPlan = Arr::get($payload, 'plan_external_id')) {
            $plan = MembershipPlan::where('organization_id', $organization->id)
                ->where('external_id', $externalPlan)
                ->first();
        }

        $location = null;
        if ($locationName = Arr::get($payload, 'home_location')) {
            $location = Location::where('organization_id', $organization->id)
                ->where('name', $locationName)
                ->first();
        }

        $attributes = [
            'organization_id' => $organization->id,
            'first_name' => Arr::get($payload, 'first_name'),
            'last_name' => Arr::get($payload, 'last_name'),
            'email_encrypted' => $email ? encrypt($email) : null,
            'email_hash' => $emailHash,
            'phone_encrypted' => $phone ? encrypt($phone) : null,
            'phone_hash' => $phoneHash,
            'status' => Arr::get($payload, 'status', 'active'),
            'joined_on' => Arr::get($payload, 'joined_on'),
            'membership_plan_id' => $plan?->id,
            'home_location_id' => $location?->id,
            'timezone' => Arr::get($payload, 'timezone', $organization->primary_timezone),
            'consents' => Arr::get($payload, 'consents', ['sms' => true, 'email' => true]),
            'tags' => Arr::get($payload, 'tags', []),
        ];

        $query = Member::query()->where('organization_id', $organization->id);

        if ($emailHash) {
            $query->where('email_hash', $emailHash);
        } elseif ($phoneHash) {
            $query->where('phone_hash', $phoneHash);
        }

        $member = $query->first();

        if ($member) {
            $member->fill($attributes);
            $member->save();

            return [$member, false];
        }

        $member = Member::create($attributes);

        return [$member, true];
    }

    protected function upsertSession(Organization $organization, array $payload): ClassSession
    {
        $location = null;
        if ($locationName = Arr::get($payload, 'location')) {
            $location = Location::where('organization_id', $organization->id)
                ->where('name', $locationName)
                ->first();
        }

        $startsAt = CarbonImmutable::parse(Arr::get($payload, 'starts_at'));
        return ClassSession::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'class_type' => Arr::get($payload, 'class_type'),
                'starts_at' => $startsAt,
            ],
            [
                'location_id' => $location?->id,
                'class_type' => Arr::get($payload, 'class_type'),
                'starts_at' => $startsAt,
                'ends_at' => Arr::get($payload, 'ends_at') ? CarbonImmutable::parse(Arr::get($payload, 'ends_at')) : $startsAt->addHour(),
                'capacity' => Arr::get($payload, 'capacity'),
                'metadata' => $payload,
            ]
        );
    }
}

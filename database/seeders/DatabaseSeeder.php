<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingConfirmation;
use App\Models\Cadence;
use App\Models\CadenceStep;
use App\Models\ClassSession;
use App\Models\ClassType;
use App\Models\Lead;
use App\Models\LeadTask;
use App\Models\Member;
use App\Models\MembershipPlan;
use App\Models\MessageTemplate;
use App\Models\Organization;
use App\Models\Playbook;
use App\Models\PlaybookVersion;
use App\Models\StaffProfile;
use App\Models\ReleaseNote;
use App\Models\User;
use App\Models\WaitlistEntry;
use App\Services\Security\RoleService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $organization = Organization::firstOrCreate(
            ['slug' => 'founders-fitness'],
            [
                'name' => 'Founders Fitness',
                'primary_timezone' => 'America/Los_Angeles',
            ]
        );

        $location = $organization->locations()->firstOrCreate(
            ['name' => 'Downtown Studio'],
            [
                'timezone' => 'America/Los_Angeles',
                'room_capacity' => 30,
                'address_line1' => '123 Market St',
                'city' => 'San Francisco',
                'state' => 'CA',
                'postal_code' => '94105',
                'country' => 'US',
                'hours' => ['mon' => '06:00-21:00', 'sat' => '08:00-18:00'],
                'deposit_policy' => ['enabled' => false],
            ]
        );

        $plan = MembershipPlan::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'external_id' => 'FOUNDERS-UNLIMITED',
            ],
            [
                'name' => 'Unlimited Training',
                'billing_interval' => 'monthly',
                'price_cents' => 18900,
                'currency' => 'USD',
            ]
        );

        $user = User::firstOrCreate(
            ['email' => 'admin@foundersfitness.com'],
            [
                'name' => 'Org Admin',
                'password' => bcrypt('password'),
            ]
        );

        $user->organization_id = $organization->id;
        $user->default_role = 'org_admin';
        $user->save();

        app(RoleService::class)->bootstrapSystemRoles($user->id);

        if (Member::where('organization_id', $organization->id)->count() === 0) {
            Member::create([
                'organization_id' => $organization->id,
                'home_location_id' => $location->id,
                'membership_plan_id' => $plan->id,
                'first_name' => 'Jordan',
                'last_name' => 'Lee',
                'email_encrypted' => encrypt('jordan@example.com'),
                'email_hash' => hash('sha256', 'jordan@example.com'),
                'status' => 'active',
                'joined_on' => now()->subMonths(4)->toDateString(),
                'consents' => ['sms' => true, 'email' => true],
            ]);

            Member::create([
                'organization_id' => $organization->id,
                'home_location_id' => $location->id,
                'membership_plan_id' => $plan->id,
                'first_name' => 'Ava',
                'last_name' => 'Patel',
                'email_encrypted' => encrypt('ava@example.com'),
                'email_hash' => hash('sha256', 'ava@example.com'),
                'status' => 'active',
                'joined_on' => now()->subMonths(2)->toDateString(),
                'consents' => ['sms' => true, 'email' => true],
            ]);
        }

        $sessions = [
            [
                'class_type' => 'HIIT 45',
                'starts_at' => CarbonImmutable::now()->addDay()->setTime(7, 0),
                'ends_at' => CarbonImmutable::now()->addDay()->setTime(7, 45),
                'capacity' => 18,
            ],
            [
                'class_type' => 'Power Cycle',
                'starts_at' => CarbonImmutable::now()->addDay()->setTime(18, 0),
                'ends_at' => CarbonImmutable::now()->addDay()->setTime(18, 50),
                'capacity' => 22,
            ],
            [
                'class_type' => 'Reformer Pilates',
                'starts_at' => CarbonImmutable::now()->addDays(2)->setTime(9, 30),
                'ends_at' => CarbonImmutable::now()->addDays(2)->setTime(10, 20),
                'capacity' => 12,
            ],
        ];

        foreach ($sessions as $sessionData) {
            ClassSession::firstOrCreate(
                [
                    'organization_id' => $organization->id,
                    'location_id' => $location->id,
                    'class_type' => $sessionData['class_type'],
                    'starts_at' => $sessionData['starts_at'],
                ],
                array_merge($sessionData, ['location_id' => $location->id, 'organization_id' => $organization->id])
            );
        }

        foreach (['HIIT 45', 'Power Cycle', 'Reformer Pilates'] as $type) {
            ClassType::firstOrCreate([
                'organization_id' => $organization->id,
                'name' => $type,
            ], [
                'description' => 'Signature ' . $type,
                'default_capacity' => 20,
            ]);
        }

        $jordan = Member::where('email_hash', hash('sha256', 'jordan@example.com'))->first();
        $ava = Member::where('email_hash', hash('sha256', 'ava@example.com'))->first();

        if ($jordan) {
            $session = ClassSession::where('organization_id', $organization->id)
                ->where('class_type', 'HIIT 45')
                ->orderBy('starts_at')
                ->first();

            if ($session) {
                $booking = Booking::firstOrCreate(
                    [
                        'organization_id' => $organization->id,
                        'member_id' => $jordan->id,
                        'class_session_id' => $session->id,
                    ],
                    [
                        'status' => 'booked',
                        'booked_at' => now()->subDay(),
                        'source' => 'app',
                    ]
                );

                BookingConfirmation::firstOrCreate(
                    [
                        'booking_id' => $booking->id,
                    ],
                    [
                        'channel' => 'sms',
                        'token' => (string) \Illuminate\Support\Str::uuid(),
                        'expires_at' => now()->addHours(12),
                    ]
                );
            }
        }

        $lead = Lead::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'email_hash' => hash('sha256', 'sam@example.com'),
            ],
            [
                'first_name' => 'Sam',
                'last_name' => 'Carter',
                'email_encrypted' => encrypt('sam@example.com'),
                'stage' => 'trial',
                'source' => 'web',
                'timezone' => 'America/Los_Angeles',
                'consents' => ['sms' => true, 'email' => true],
                'preferred_location_id' => $location->id,
            ]
        );

        if ($lead && $jordan) {
            $pilates = ClassSession::where('organization_id', $organization->id)
                ->where('class_type', 'Reformer Pilates')
                ->orderBy('starts_at')
                ->first();

            if ($pilates) {
                WaitlistEntry::firstOrCreate(
                    [
                        'organization_id' => $organization->id,
                        'class_session_id' => $pilates->id,
                        'lead_id' => $lead->id,
                    ],
                    [
                        'position' => 1,
                        'status' => 'waiting',
                    ]
                );
            }
        }

        $cadence = Cadence::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'name' => 'Trial Follow-up',
            ],
            [
                'channel' => 'sms',
                'steps_count' => 2,
                'is_default' => true,
                'metadata' => ['note' => 'Placeholder cadence until providers wired'],
            ]
        );

        $step1 = CadenceStep::firstOrCreate(
            [
                'cadence_id' => $cadence->id,
                'step_order' => 1,
            ],
            [
                'channel' => 'sms',
                'delay_minutes' => 60,
            ]
        );

        CadenceStep::firstOrCreate(
            [
                'cadence_id' => $cadence->id,
                'step_order' => 2,
            ],
            [
                'channel' => 'email',
                'delay_minutes' => 720,
            ]
        );

        if ($lead) {
            $lead->cadence_id = $cadence->id;
            $lead->cadence_started_at = now()->subHours(2);
            $lead->save();

            LeadTask::firstOrCreate(
                [
                    'lead_id' => $lead->id,
                    'type' => 'call',
                ],
                [
                    'cadence_step_id' => $step1->id,
                    'due_at' => now()->addHour(),
                    'status' => 'open',
                ]
            );
        }

        StaffProfile::firstOrCreate(
            [
                'user_id' => $user->id,
                'organization_id' => $organization->id,
            ],
            [
                'title' => 'Director of Operations',
                'is_instructor' => true,
                'bio' => 'Loves programming HIIT and kettlebell flows.',
                'primary_location_id' => $location->id,
                'certifications' => ['ACE'],
            ]
        );

        ReleaseNote::firstOrCreate(
            [
                'organization_id' => $organization->id,
                'title' => 'Sprint 2 roll-out',
            ],
            [
                'body' => 'Capacity dashboard, CRM analytics, freeze rescue, and admin settings are live.',
                'version' => 'sprint-2',
                'published_at' => now()->subDay(),
            ]
        );

        $smsTemplate = MessageTemplate::firstOrCreate([
            'organization_id' => $organization->id,
            'slug' => 'streak-save-sms',
        ], [
            'channel' => 'sms',
            'name' => 'Streak Save',
            'content_text' => 'We miss you at the studio! Book this week and claim a free guest pass.',
            'variables' => ['first_name', 'studio_name'],
            'is_default' => true,
        ]);

        $playbook = Playbook::firstOrCreate([
            'organization_id' => $organization->id,
            'name' => 'Streak Save',
        ], [
            'status' => 'active',
            'trigger_type' => 'no_check_in',
            'trigger_config' => ['days' => 7],
            'channel_strategy' => ['primary' => 'sms'],
            'primary_template_id' => $smsTemplate->id,
        ]);

        PlaybookVersion::firstOrCreate([
            'playbook_id' => $playbook->id,
            'version' => 1,
        ], [
            'definition' => [
                'trigger_type' => 'no_check_in',
                'trigger_config' => ['days' => 7],
                'channel_strategy' => ['primary' => 'sms'],
            ],
        ]);

        $freezeTemplate = MessageTemplate::firstOrCreate([
            'organization_id' => $organization->id,
            'slug' => 'freeze-rescue-sms',
        ], [
            'channel' => 'sms',
            'name' => 'Freeze Rescue',
            'content_text' => 'Before you freeze, enjoy 2 weeks at 50% + a buddy pass. Want to give it a try?',
            'variables' => ['first_name'],
        ]);

        Playbook::firstOrCreate([
            'organization_id' => $organization->id,
            'name' => 'Freeze Rescue',
        ], [
            'status' => 'active',
            'trigger_type' => 'freeze_request',
            'trigger_config' => ['sla_seconds' => 180],
            'channel_strategy' => ['primary' => 'sms'],
            'primary_template_id' => $freezeTemplate->id,
        ]);

        $winbackTemplate = MessageTemplate::firstOrCreate([
            'organization_id' => $organization->id,
            'slug' => 'win-back-email',
        ], [
            'channel' => 'email',
            'name' => 'Win-back <30d',
            'subject' => 'Let’s pick up where you left off',
            'content_html' => '<p>We saved your favorite class time for the next two weeks.</p>',
        ]);

        Playbook::firstOrCreate([
            'organization_id' => $organization->id,
            'name' => 'Win-back <30d',
        ], [
            'status' => 'active',
            'trigger_type' => 'win_back',
            'trigger_config' => ['days' => 30],
            'channel_strategy' => ['primary' => 'email'],
            'primary_template_id' => $winbackTemplate->id,
        ]);
    }
}

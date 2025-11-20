<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\WorkoutItem;
use App\Models\WorkoutProgram;
use App\Models\WorkoutSession;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class WorkoutProgramSeeder extends Seeder
{
    public function run(): void
    {
        $organizations = Organization::all();
        if ($organizations->isEmpty()) {
            return;
        }

        $start = CarbonImmutable::parse('2025-11-10');
        $template = [
            [
                'date' => $start,
                'label' => 'Week 34',
                'items' => [
                    ['title' => 'Warmup', 'block' => 'Warmup', 'instructions' => '3 minutes bike, pass-throughs, scap pushups'],
                    ['title' => 'Back Squat 5x5', 'block' => 'Strength', 'instructions' => 'Work up to 80% and hold across working sets'],
                    ['title' => 'Rack Pull 4x8', 'block' => 'Accessory', 'instructions' => 'Use straps and pause at the knee'],
                ],
            ],
            [
                'date' => $start->addDay(),
                'label' => 'Bench focus',
                'items' => [
                    ['title' => 'Warmup', 'block' => 'Warmup', 'instructions' => 'Bike + band pull-aparts'],
                    ['title' => 'Close Grip Bench 1x5', 'block' => 'Strength', 'instructions' => 'Work to a heavy single set'],
                    ['title' => 'Dumbbell Bench 4x12', 'block' => 'Accessory', 'instructions' => '2121 tempo, focus on stretch'],
                ],
            ],
            [
                'date' => $start->addDays(2),
                'label' => null,
                'items' => [],
            ],
            [
                'date' => $start->addDays(3),
                'label' => 'Deadlift focus',
                'items' => [
                    ['title' => 'Warmup', 'block' => 'Warmup', 'instructions' => 'Bike, empty bar RDLs'],
                    ['title' => 'Box Squat 1x1', 'block' => 'Strength', 'instructions' => 'Beltless single.'],
                    ['title' => 'Sumo Deadlift 4x6', 'block' => 'Strength', 'instructions' => 'Use straps, RPE 8.'],
                ],
            ],
            [
                'date' => $start->addDays(4),
                'label' => 'Upper power',
                'items' => [
                    ['title' => 'Warmup', 'block' => 'Warmup', 'instructions' => 'Bike, scap pushups'],
                    ['title' => 'Bench Press 10x3', 'block' => 'Strength', 'instructions' => 'Dynamic effort at 55% + chains'],
                    ['title' => 'Shoulder Press 1x3', 'block' => 'Strength', 'instructions' => 'Top triple, no grind'],
                ],
            ],
            [
                'date' => $start->addDays(5),
                'label' => null,
                'items' => [],
            ],
            [
                'date' => $start->addDays(6),
                'label' => null,
                'items' => [],
            ],
        ];

        foreach ($organizations as $organization) {
            $program = WorkoutProgram::firstOrCreate(
                [
                    'organization_id' => $organization->id,
                    'name' => 'I-Backs Powerlifting',
                ],
                [
                    'description' => 'Heavy/Power + accessory split focused on raw strength.',
                    'color' => '#2563EB',
                ]
            );

            foreach ($template as $index => $day) {
                $session = WorkoutSession::updateOrCreate(
                    [
                        'workout_program_id' => $program->id,
                        'scheduled_for' => $day['date']->toDateString(),
                    ],
                    [
                        'organization_id' => $organization->id,
                        'label' => $day['label'],
                        'position' => $index,
                    ]
                );

                if ($session->items()->exists()) {
                    continue;
                }

                foreach ($day['items'] as $position => $item) {
                    WorkoutItem::create([
                        'workout_session_id' => $session->id,
                        'organization_id' => $organization->id,
                        'title' => Arr::get($item, 'title'),
                        'block' => Arr::get($item, 'block', 'Workout'),
                        'instructions' => Arr::get($item, 'instructions'),
                        'position' => $position,
                    ]);
                }
            }
        }
    }
}

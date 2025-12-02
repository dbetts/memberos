<?php

namespace Database\Seeders;

use App\Models\Exercise;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ExerciseCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            // Warm-up / mobility
            ['name' => 'Jumping Jacks', 'type' => 'warmup', 'category' => 'Full Body', 'modality' => 'Bodyweight'],
            ['name' => 'Air Squat', 'type' => 'warmup', 'category' => 'Lower', 'modality' => 'Bodyweight'],
            ['name' => 'World’s Greatest Stretch', 'type' => 'warmup', 'category' => 'Mobility', 'modality' => 'Bodyweight'],
            ['name' => 'Banded Shoulder Opener', 'type' => 'warmup', 'category' => 'Shoulders', 'modality' => 'Band'],
            ['name' => 'Cat-Cow', 'type' => 'warmup', 'category' => 'Mobility', 'modality' => 'Bodyweight'],
            ['name' => 'Glute Bridge', 'type' => 'warmup', 'category' => 'Posterior Chain', 'modality' => 'Bodyweight'],
            ['name' => 'Inchworm', 'type' => 'warmup', 'category' => 'Full Body', 'modality' => 'Bodyweight'],
            ['name' => 'Rowing Easy Pace', 'type' => 'warmup', 'category' => 'Cardio', 'modality' => 'Erg'],
            ['name' => 'Assault Bike Easy Pace', 'type' => 'warmup', 'category' => 'Cardio', 'modality' => 'Bike'],
            ['name' => 'Light Jog', 'type' => 'warmup', 'category' => 'Cardio', 'modality' => 'Run'],

            // Strength – Squat
            ['name' => 'Back Squat', 'type' => 'strength', 'category' => 'Squat', 'modality' => 'Barbell'],
            ['name' => 'Front Squat', 'type' => 'strength', 'category' => 'Squat', 'modality' => 'Barbell'],
            ['name' => 'Overhead Squat', 'type' => 'strength', 'category' => 'Squat', 'modality' => 'Barbell'],
            ['name' => 'Goblet Squat', 'type' => 'strength', 'category' => 'Squat', 'modality' => 'Dumbbell'],
            ['name' => 'Bulgarian Split Squat', 'type' => 'strength', 'category' => 'Single Leg', 'modality' => 'Dumbbell'],
            ['name' => 'Lunge', 'type' => 'strength', 'category' => 'Single Leg', 'modality' => 'Bodyweight'],

            // Strength – Hinge
            ['name' => 'Deadlift', 'type' => 'strength', 'category' => 'Hinge', 'modality' => 'Barbell'],
            ['name' => 'Romanian Deadlift', 'type' => 'strength', 'category' => 'Hinge', 'modality' => 'Barbell'],
            ['name' => 'Kettlebell Swing', 'type' => 'strength', 'category' => 'Hinge', 'modality' => 'Kettlebell'],
            ['name' => 'Hip Thrust', 'type' => 'strength', 'category' => 'Glutes', 'modality' => 'Barbell'],
            ['name' => 'Good Morning', 'type' => 'strength', 'category' => 'Posterior Chain', 'modality' => 'Barbell'],

            // Strength – Press
            ['name' => 'Bench Press', 'type' => 'strength', 'category' => 'Chest', 'modality' => 'Barbell'],
            ['name' => 'Incline Bench Press', 'type' => 'strength', 'category' => 'Chest', 'modality' => 'Barbell'],
            ['name' => 'Dumbbell Bench Press', 'type' => 'strength', 'category' => 'Chest', 'modality' => 'Dumbbell'],
            ['name' => 'Push Press', 'type' => 'strength', 'category' => 'Shoulders', 'modality' => 'Barbell'],
            ['name' => 'Strict Press', 'type' => 'strength', 'category' => 'Shoulders', 'modality' => 'Barbell'],
            ['name' => 'Dumbbell Shoulder Press', 'type' => 'strength', 'category' => 'Shoulders', 'modality' => 'Dumbbell'],
            ['name' => 'Handstand Push-up', 'type' => 'strength', 'category' => 'Shoulders', 'modality' => 'Bodyweight'],
            ['name' => 'Push-up', 'type' => 'strength', 'category' => 'Chest', 'modality' => 'Bodyweight'],

            // Strength – Pull
            ['name' => 'Pull-up', 'type' => 'strength', 'category' => 'Pull', 'modality' => 'Bodyweight'],
            ['name' => 'Chest-to-Bar Pull-up', 'type' => 'strength', 'category' => 'Pull', 'modality' => 'Bodyweight'],
            ['name' => 'Ring Row', 'type' => 'strength', 'category' => 'Pull', 'modality' => 'Bodyweight'],
            ['name' => 'Barbell Row', 'type' => 'strength', 'category' => 'Back', 'modality' => 'Barbell'],
            ['name' => 'Dumbbell Row', 'type' => 'strength', 'category' => 'Back', 'modality' => 'Dumbbell'],
            ['name' => 'Lat Pulldown', 'type' => 'strength', 'category' => 'Back', 'modality' => 'Cable'],
            ['name' => 'Biceps Curl', 'type' => 'strength', 'category' => 'Arms', 'modality' => 'Dumbbell'],
            ['name' => 'Hammer Curl', 'type' => 'strength', 'category' => 'Arms', 'modality' => 'Dumbbell'],
            ['name' => 'Triceps Dip', 'type' => 'strength', 'category' => 'Arms', 'modality' => 'Bodyweight'],
            ['name' => 'Triceps Pushdown', 'type' => 'strength', 'category' => 'Arms', 'modality' => 'Cable'],

            // Olympic lifts
            ['name' => 'Power Clean', 'type' => 'strength', 'category' => 'Olympic', 'modality' => 'Barbell'],
            ['name' => 'Squat Clean', 'type' => 'strength', 'category' => 'Olympic', 'modality' => 'Barbell'],
            ['name' => 'Power Snatch', 'type' => 'strength', 'category' => 'Olympic', 'modality' => 'Barbell'],
            ['name' => 'Squat Snatch', 'type' => 'strength', 'category' => 'Olympic', 'modality' => 'Barbell'],
            ['name' => 'Clean and Jerk', 'type' => 'strength', 'category' => 'Olympic', 'modality' => 'Barbell'],

            // Metcon / conditioning
            ['name' => 'Burpee', 'type' => 'metcon', 'category' => 'Bodyweight', 'modality' => 'Bodyweight'],
            ['name' => 'Wall Ball Shot', 'type' => 'metcon', 'category' => 'Full Body', 'modality' => 'Med Ball'],
            ['name' => 'Box Jump', 'type' => 'metcon', 'category' => 'Plyometric', 'modality' => 'Bodyweight'],
            ['name' => 'Double-Under', 'type' => 'metcon', 'category' => 'Cardio', 'modality' => 'Jump Rope'],
            ['name' => 'Row Erg', 'type' => 'metcon', 'category' => 'Cardio', 'modality' => 'Erg'],
            ['name' => 'Assault Bike', 'type' => 'metcon', 'category' => 'Cardio', 'modality' => 'Bike'],
            ['name' => 'Ski Erg', 'type' => 'metcon', 'category' => 'Cardio', 'modality' => 'Erg'],
            ['name' => 'Run 400m', 'type' => 'metcon', 'category' => 'Cardio', 'modality' => 'Run'],
            ['name' => 'Farmer Carry', 'type' => 'metcon', 'category' => 'Carry', 'modality' => 'Dumbbell'],
            ['name' => 'Slam Ball', 'type' => 'metcon', 'category' => 'Power', 'modality' => 'Med Ball'],
            ['name' => 'Kettlebell Snatch', 'type' => 'metcon', 'category' => 'Power', 'modality' => 'Kettlebell'],
            ['name' => 'Devils Press', 'type' => 'metcon', 'category' => 'Full Body', 'modality' => 'Dumbbell'],

            // Skill
            ['name' => 'Toes-to-Bar', 'type' => 'skill', 'category' => 'Core', 'modality' => 'Bodyweight'],
            ['name' => 'Kipping Pull-up', 'type' => 'skill', 'category' => 'Gymnastics', 'modality' => 'Bodyweight'],
            ['name' => 'Muscle-Up (Ring)', 'type' => 'skill', 'category' => 'Gymnastics', 'modality' => 'Bodyweight'],
            ['name' => 'Pistol Squat', 'type' => 'skill', 'category' => 'Single Leg', 'modality' => 'Bodyweight'],
            ['name' => 'Handstand Walk', 'type' => 'skill', 'category' => 'Gymnastics', 'modality' => 'Bodyweight'],
            ['name' => 'Double-Under Practice', 'type' => 'skill', 'category' => 'Jump Rope', 'modality' => 'Jump Rope'],

            // Core
            ['name' => 'Plank', 'type' => 'strength', 'category' => 'Core', 'modality' => 'Bodyweight'],
            ['name' => 'Hollow Hold', 'type' => 'strength', 'category' => 'Core', 'modality' => 'Bodyweight'],
            ['name' => 'Russian Twist', 'type' => 'strength', 'category' => 'Core', 'modality' => 'Med Ball'],
            ['name' => 'GHD Sit-up', 'type' => 'strength', 'category' => 'Core', 'modality' => 'GHD'],

            // Cool-down
            ['name' => 'Foam Roll Quads', 'type' => 'cooldown', 'category' => 'Recovery', 'modality' => 'Foam Roller'],
            ['name' => 'Foam Roll Lats', 'type' => 'cooldown', 'category' => 'Recovery', 'modality' => 'Foam Roller'],
            ['name' => 'Pigeon Pose', 'type' => 'cooldown', 'category' => 'Mobility', 'modality' => 'Bodyweight'],
            ['name' => 'Child’s Pose', 'type' => 'cooldown', 'category' => 'Mobility', 'modality' => 'Bodyweight'],
            ['name' => 'Light Bike Flush', 'type' => 'cooldown', 'category' => 'Cardio', 'modality' => 'Bike'],
        ];

        $rows = array_map(function (array $entry) {
            $entry['organization_id'] = null; // global catalog
            $entry['slug'] = Str::slug($entry['name']);
            $entry['is_public'] = true;

            return $entry;
        }, $catalog);

        Exercise::query()->upsert(
            $rows,
            ['organization_id', 'slug'],
            ['name', 'type', 'category', 'modality', 'is_public']
        );
    }
}

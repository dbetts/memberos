<?php

namespace Database\Seeders;

use App\Models\Exercise;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExerciseCsvSeeder extends Seeder
{
    public function run(): void
    {
        $path = base_path('Documents/exercises.csv');
        if (! file_exists($path)) {
            $this->command?->warn("Exercise CSV not found at {$path}, skipping.");
            return;
        }

        $handle = fopen($path, 'r');
        if (! $handle) {
            $this->command?->error("Unable to open {$path}");
            return;
        }

        $header = fgetcsv($handle);
        if (! $header) {
            $this->command?->error("No header row found in {$path}");
            fclose($handle);
            return;
        }

        $rows = [];
        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) < 4) {
                continue;
            }
            [$name, $type, $category, $modality] = $data;
            $rows[] = [
                'organization_id' => null,
                'name' => trim($name),
                'slug' => Str::slug($name),
                'type' => strtolower(trim($type)),
                'category' => trim($category) ?: null,
                'modality' => trim($modality) ?: null,
                'is_public' => true,
            ];
        }
        fclose($handle);

        if (empty($rows)) {
            $this->command?->warn("No exercise rows parsed from {$path}");
            return;
        }

        // Replace existing catalog entirely with the CSV contents
        Exercise::query()->delete();

        Exercise::query()->upsert(
            $rows,
            ['organization_id', 'slug'],
            ['name', 'type', 'category', 'modality', 'is_public']
        );

        $this->command?->info('Exercise CSV seeding complete: ' . count($rows) . ' exercises upserted.');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('workout_sessions') && ! Schema::hasTable('workouts')) {
            Schema::rename('workout_sessions', 'workouts');
        }

        if (! Schema::hasTable('workout_items')) {
            return;
        }

        Schema::table('workout_items', function (Blueprint $table): void {
            if (Schema::hasColumn('workout_items', 'workout_session_id')) {
                $table->dropForeign(['workout_session_id']);
            }

            if (Schema::hasColumn('workout_items', 'organization_id')) {
                $table->dropForeign(['organization_id']);
            }
        });

        if (Schema::hasColumn('workout_items', 'workout_session_id')) {
            DB::statement('ALTER TABLE workout_items RENAME COLUMN workout_session_id TO workout_id');
        }

        if (Schema::hasColumn('workout_items', 'organization_id')) {
            try {
                DB::statement('DROP INDEX IF EXISTS workout_items_organization_id_exercise_type_index');
            } catch (\Throwable $e) {
                // ignore if index does not exist or connection does not support dropping
            }
            DB::statement('ALTER TABLE workout_items DROP COLUMN organization_id');
        }

        if (Schema::hasColumn('workout_items', 'block')) {
            DB::statement('ALTER TABLE workout_items DROP COLUMN block');
        }

        Schema::table('workout_items', function (Blueprint $table): void {
            if (! Schema::hasColumn('workout_items', 'reps')) {
                $table->json('reps')->nullable();
            }
            if (! Schema::hasColumn('workout_items', 'metric')) {
                $table->string('metric', 50)->nullable();
            }
            if (! Schema::hasColumn('workout_items', 'visible_to')) {
                $table->string('visible_to', 50)->nullable();
            }
        });

        Schema::table('workout_items', function (Blueprint $table): void {
            if (! Schema::hasColumn('workout_items', 'workout_id')) {
                return;
            }
            $table->foreign('workout_id')->references('id')->on('workouts')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('workout_items')) {
            return;
        }

        Schema::table('workout_items', function (Blueprint $table): void {
            if (Schema::hasColumn('workout_items', 'workout_id')) {
                $table->dropForeign(['workout_id']);
            }
        });

        if (Schema::hasColumn('workout_items', 'reps')) {
            DB::statement('ALTER TABLE workout_items DROP COLUMN reps');
        }
        if (Schema::hasColumn('workout_items', 'metric')) {
            DB::statement('ALTER TABLE workout_items DROP COLUMN metric');
        }
        if (Schema::hasColumn('workout_items', 'visible_to')) {
            DB::statement('ALTER TABLE workout_items DROP COLUMN visible_to');
        }

        if (! Schema::hasColumn('workout_items', 'block')) {
            DB::statement("ALTER TABLE workout_items ADD COLUMN block VARCHAR(255) NOT NULL DEFAULT 'Workout'");
        }
        if (! Schema::hasColumn('workout_items', 'organization_id')) {
            DB::statement('ALTER TABLE workout_items ADD COLUMN organization_id UUID');
        }

        if (Schema::hasColumn('workout_items', 'workout_id')) {
            DB::statement('ALTER TABLE workout_items RENAME COLUMN workout_id TO workout_session_id');
        }

        if (Schema::hasColumn('workout_items', 'organization_id')) {
            DB::statement('UPDATE workout_items SET organization_id = workouts.organization_id FROM workouts WHERE workouts.id = workout_items.workout_session_id');
        }

        Schema::table('workout_items', function (Blueprint $table): void {
            if (Schema::hasColumn('workout_items', 'workout_session_id')) {
                $table->foreign('workout_session_id')
                    ->references('id')
                    ->on('workout_sessions')
                    ->cascadeOnDelete();
            }

            if (Schema::hasColumn('workout_items', 'organization_id')) {
                $table->foreign('organization_id')
                    ->references('id')
                    ->on('organizations')
                    ->cascadeOnDelete();
                $table->index(['organization_id', 'exercise_type']);
            }
        });

        if (Schema::hasTable('workouts') && ! Schema::hasTable('workout_sessions')) {
            Schema::rename('workouts', 'workout_sessions');
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->nullable();
            $table->string('name');
            $table->string('slug');
            $table->string('type')->nullable(); // warmup, strength, metcon, skill, cooldown
            $table->string('category')->nullable(); // e.g., Chest, Conditioning
            $table->string('modality')->nullable(); // e.g., Barbell, Dumbbell, Bodyweight
            $table->boolean('is_public')->default(true); // public == shared catalog
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->unique(['organization_id', 'slug']);
        });

        Schema::table('workout_items', function (Blueprint $table): void {
            $table->uuid('exercise_id')->nullable()->after('organization_id');
            $table->string('exercise_type')->nullable()->after('block');
            $table->string('measurement_type')->nullable()->after('exercise_type');
            $table->json('measurement')->nullable()->after('measurement_type');
            $table->unsignedSmallInteger('rest_seconds')->nullable()->after('measurement');
            $table->boolean('is_scored')->default(false)->after('rest_seconds');

            $table->foreign('exercise_id')->references('id')->on('exercises')->nullOnDelete();
            $table->index(['organization_id', 'exercise_type']);
        });
    }

    public function down(): void
    {
        Schema::table('workout_items', function (Blueprint $table): void {
            $table->dropForeign(['exercise_id']);
            $table->dropIndex(['organization_id', 'exercise_type']);
            $table->dropColumn(['exercise_id', 'exercise_type', 'measurement_type', 'measurement', 'rest_seconds', 'is_scored']);
        });

        Schema::dropIfExists('exercises');
    }
};

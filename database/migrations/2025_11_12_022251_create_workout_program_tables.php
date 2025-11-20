<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_programs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        Schema::create('workout_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('workout_program_id');
            $table->uuid('organization_id');
            $table->date('scheduled_for');
            $table->string('label')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('workout_program_id')->references('id')->on('workout_programs')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->unique(['workout_program_id', 'scheduled_for']);
        });

        Schema::create('workout_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('workout_session_id');
            $table->uuid('organization_id');
            $table->string('title');
            $table->string('block')->default('Workout');
            $table->text('instructions')->nullable();
            $table->text('coach_notes')->nullable();
            $table->text('athlete_notes')->nullable();
            $table->string('color')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('workout_session_id')->references('id')->on('workout_sessions')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_items');
        Schema::dropIfExists('workout_sessions');
        Schema::dropIfExists('workout_programs');
    }
};

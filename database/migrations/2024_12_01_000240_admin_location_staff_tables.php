<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table): void {
            $table->json('hours')->nullable()->after('metadata');
            $table->json('deposit_policy')->nullable()->after('hours');
            $table->unsignedInteger('cancellation_window_minutes')->default(60)->after('deposit_policy');
        });

        Schema::create('class_types', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->string('description')->nullable();
            $table->unsignedSmallInteger('default_capacity')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->unique(['organization_id', 'name']);
        });

        Schema::create('staff_profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->uuid('organization_id');
            $table->string('title')->nullable();
            $table->boolean('is_instructor')->default(false);
            $table->text('bio')->nullable();
            $table->json('certifications')->nullable();
            $table->json('specialties')->nullable();
            $table->uuid('primary_location_id')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('primary_location_id')->references('id')->on('locations')->nullOnDelete();
            $table->unique(['user_id', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_profiles');
        Schema::dropIfExists('class_types');
        Schema::table('locations', function (Blueprint $table): void {
            $table->dropColumn(['hours', 'deposit_policy', 'cancellation_window_minutes']);
        });
    }
};

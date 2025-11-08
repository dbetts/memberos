<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('home_location_id')->nullable();
            $table->uuid('membership_plan_id')->nullable();
            $table->string('first_name');
            $table->string('last_name');
            $table->text('email_encrypted')->nullable();
            $table->string('email_hash')->nullable();
            $table->text('phone_encrypted')->nullable();
            $table->string('phone_hash')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->date('joined_on')->nullable();
            $table->string('status')->default('active');
            $table->string('preferred_contact_channel')->nullable();
            $table->string('timezone')->nullable();
            $table->unsignedSmallInteger('daily_send_cap')->default(3);
            $table->unsignedSmallInteger('weekly_send_cap')->default(12);
            $table->time('quiet_hours_start')->nullable();
            $table->time('quiet_hours_end')->nullable();
            $table->boolean('quiet_hours_override')->default(false);
            $table->json('consents')->nullable(); // {sms: true, email: true}
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('home_location_id')->references('id')->on('locations')->nullOnDelete();
            $table->foreign('membership_plan_id')->references('id')->on('membership_plans')->nullOnDelete();
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'email_hash']);
            $table->index(['organization_id', 'phone_hash']);
        });

        Schema::create('member_external_ids', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('member_id');
            $table->string('provider');
            $table->string('external_id');
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->unique(['provider', 'external_id']);
        });

        Schema::create('member_merge_candidates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('primary_member_id');
            $table->uuid('conflicting_member_id');
            $table->decimal('confidence_score', 5, 2)->nullable();
            $table->string('status')->default('pending'); // pending, merged, dismissed
            $table->json('signals')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('primary_member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->foreign('conflicting_member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->index(['organization_id', 'status']);
        });

        Schema::create('class_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('location_id');
            $table->foreignId('instructor_id')->nullable()->constrained('users')->nullOnDelete(); // references users
            $table->string('class_type');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->string('status')->default('scheduled');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('location_id')->references('id')->on('locations')->cascadeOnDelete();
            $table->index(['organization_id', 'starts_at']);
            $table->index(['organization_id', 'class_type']);
        });

        Schema::create('bookings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('member_id');
            $table->uuid('class_session_id');
            $table->string('status')->default('booked');
            $table->string('source')->nullable();
            $table->unsignedInteger('deposit_cents')->nullable();
            $table->unsignedSmallInteger('waitlist_position')->nullable();
            $table->timestamp('booked_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamp('attended_at')->nullable();
            $table->timestamp('no_show_recorded_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->foreign('class_session_id')->references('id')->on('class_sessions')->cascadeOnDelete();
            $table->index(['organization_id', 'status']);
            $table->index(['class_session_id', 'status']);
        });

        Schema::create('check_ins', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('member_id');
            $table->uuid('location_id');
            $table->uuid('class_session_id')->nullable();
            $table->timestamp('checked_in_at');
            $table->string('method')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->foreign('location_id')->references('id')->on('locations')->cascadeOnDelete();
            $table->foreign('class_session_id')->references('id')->on('class_sessions')->nullOnDelete();
            $table->index(['organization_id', 'checked_in_at']);
        });

        Schema::create('leads', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('converted_member_id')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->text('email_encrypted')->nullable();
            $table->string('email_hash')->nullable();
            $table->text('phone_encrypted')->nullable();
            $table->string('phone_hash')->nullable();
            $table->string('source')->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('stage')->default('new');
            $table->unsignedTinyInteger('score')->nullable();
            $table->string('preferred_contact_channel')->nullable();
            $table->json('consents')->nullable();
            $table->string('timezone')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('duplicate_of_id')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('converted_member_id')->references('id')->on('members')->nullOnDelete();
            $table->index(['organization_id', 'stage']);
            $table->index(['organization_id', 'email_hash']);
            $table->index(['organization_id', 'phone_hash']);
        });

        Schema::table('leads', function (Blueprint $table): void {
            $table->foreign('duplicate_of_id')->references('id')->on('leads')->nullOnDelete();
        });

        Schema::create('payments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('member_id');
            $table->uuid('membership_plan_id')->nullable();
            $table->unsignedInteger('amount_cents');
            $table->char('currency', 3)->default('USD');
            $table->string('cycle')->nullable();
            $table->string('status')->default('pending');
            $table->date('due_on')->nullable();
            $table->date('paid_on')->nullable();
            $table->date('next_bill_on')->nullable();
            $table->string('external_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->foreign('membership_plan_id')->references('id')->on('membership_plans')->nullOnDelete();
            $table->index(['organization_id', 'status']);
        });

        Schema::create('outcomes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('member_id');
            $table->string('type');
            $table->decimal('value_numeric', 10, 2)->nullable();
            $table->string('value_text')->nullable();
            $table->date('recorded_on');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->index(['organization_id', 'type', 'recorded_on']);
        });

        Schema::create('risk_scores', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('member_id')->unique();
            $table->uuid('organization_id');
            $table->unsignedTinyInteger('score');
            $table->json('reasons')->nullable();
            $table->timestamp('calculated_at');
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->index(['organization_id', 'score']);
        });

        Schema::create('risk_score_snapshots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('risk_score_id');
            $table->unsignedTinyInteger('score');
            $table->json('reasons')->nullable();
            $table->timestamp('calculated_at');
            $table->timestamps();

            $table->foreign('risk_score_id')->references('id')->on('risk_scores')->cascadeOnDelete();
            $table->index(['risk_score_id', 'calculated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_score_snapshots');
        Schema::dropIfExists('risk_scores');
        Schema::dropIfExists('outcomes');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('leads');
        Schema::dropIfExists('check_ins');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('class_sessions');
        Schema::dropIfExists('member_merge_candidates');
        Schema::dropIfExists('member_external_ids');
        Schema::dropIfExists('members');
    }
};

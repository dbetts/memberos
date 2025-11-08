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
        Schema::create('kpi_snapshots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('monthly_churn_rate', 5, 2)->nullable();
            $table->decimal('ninety_day_survival_rate', 5, 2)->nullable();
            $table->decimal('class_fill_percent', 5, 2)->nullable();
            $table->decimal('no_show_percent', 5, 2)->nullable();
            $table->decimal('waitlist_conversion_percent', 5, 2)->nullable();
            $table->decimal('lead_to_trial_rate', 5, 2)->nullable();
            $table->decimal('trial_to_join_rate', 5, 2)->nullable();
            $table->unsignedBigInteger('mrr_cents')->nullable();
            $table->json('dimensions')->nullable(); // e.g. location, program
            $table->json('breakdown')->nullable();
            $table->uuid('calculated_by')->nullable();
            $table->timestamp('calculated_at')->useCurrent();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->index(['organization_id', 'period_start', 'period_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_snapshots');
    }
};

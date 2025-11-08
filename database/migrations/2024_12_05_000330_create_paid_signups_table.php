<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paid_signups', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->unsignedBigInteger('user_id');
            $table->string('admin_email');
            $table->string('admin_name')->nullable();
            $table->string('token')->unique();
            $table->string('payment_reference')->nullable();
            $table->text('temp_password_encrypted')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paid_signups');
    }
};

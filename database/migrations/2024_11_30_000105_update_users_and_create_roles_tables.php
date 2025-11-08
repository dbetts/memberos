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
        Schema::table('users', function (Blueprint $table): void {
            $table->uuid('organization_id')->nullable()->after('id');
            $table->uuid('primary_location_id')->nullable()->after('organization_id');
            $table->string('phone')->nullable()->after('email');
            $table->string('timezone')->nullable()->after('phone');
            $table->string('default_role')->nullable()->after('timezone');
            $table->string('mfa_preference')->default('totp')->after('default_role');
            $table->boolean('mfa_enabled')->default(false)->after('mfa_preference');
            $table->timestamp('last_login_at')->nullable()->after('remember_token');
            $table->json('profile')->nullable()->after('last_login_at');

            $table->foreign('organization_id')->references('id')->on('organizations')->nullOnDelete();
            $table->foreign('primary_location_id')->references('id')->on('locations')->nullOnDelete();
        });

        Schema::create('roles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->nullable();
            $table->string('name');
            $table->string('slug');
            $table->boolean('is_system')->default(false);
            $table->json('permissions')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['organization_id', 'slug']);
        });

        Schema::create('role_assignments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('role_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('location_id')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->foreign('location_id')->references('id')->on('locations')->nullOnDelete();
            $table->unique(['user_id', 'role_id', 'location_id']);
        });

        Schema::create('user_mfa_methods', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // sms or totp
            $table->string('label')->nullable();
            $table->text('phone_encrypted')->nullable();
            $table->string('phone_hash')->nullable();
            $table->text('secret_encrypted')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_mfa_methods');
        Schema::dropIfExists('role_assignments');
        Schema::dropIfExists('roles');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['organization_id']);
            $table->dropForeign(['primary_location_id']);
            $table->dropColumn([
                'organization_id',
                'primary_location_id',
                'phone',
                'timezone',
                'default_role',
                'mfa_preference',
                'mfa_enabled',
                'last_login_at',
                'profile',
            ]);
        });
    }
};

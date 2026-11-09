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
        Schema::create('fraud_alert_workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fraud_alert_id')->unique()->constrained('fraud_alert')->cascadeOnDelete();
            $table->string('status', 32)->default('waiting_review');
            $table->boolean('audit_prioritized')->default(false);
            $table->foreignId('prioritized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('prioritized_at')->nullable();
            $table->timestamps();
        });

        Schema::create('anomaly_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fraud_alert_id')->constrained('fraud_alert')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action_type', 40);
            $table->string('title', 160);
            $table->text('notes')->nullable();
            $table->string('previous_status', 32)->nullable();
            $table->string('new_status', 32)->nullable();
            $table->timestamps();
            $table->index(['fraud_alert_id', 'created_at']);
        });

        Schema::create('warning_letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fraud_alert_id')->constrained('fraud_alert')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 24)->default('draft');
            $table->json('preview_data');
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 80);
            $table->string('resource', 80);
            $table->string('resource_id', 80)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
            $table->index(['resource', 'resource_id']);
        });

        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('nip', 30)->nullable();
            $table->string('position', 120)->nullable();
            $table->string('employment_status', 80)->nullable();
            $table->string('organization_unit', 160)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('assigned_city', 120)->nullable();
            $table->string('assigned_office', 160)->nullable();
            $table->string('avatar_url')->nullable();
            $table->timestamps();
        });

        Schema::create('company_risk_scores', function (Blueprint $table) {
            $table->id();
            $table->char('company_npwp', 16);
            $table->unsignedSmallInteger('tahun');
            $table->unsignedSmallInteger('masa');
            $table->decimal('score', 10, 4);
            $table->string('level', 10);
            $table->json('breakdown');
            $table->timestamp('generated_at');
            $table->timestamps();
            $table->unique(['company_npwp', 'tahun', 'masa']);
            $table->index(['tahun', 'masa', 'level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_risk_scores');
        Schema::dropIfExists('staff_profiles');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('warning_letters');
        Schema::dropIfExists('anomaly_follow_ups');
        Schema::dropIfExists('fraud_alert_workflows');
    }
};

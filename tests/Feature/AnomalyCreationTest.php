<?php

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot open the manual anomaly form', function () {
    $response = $this->get(route('anomalies.create'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can open the manual anomaly form', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('anomalies.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('anomalies/create')
            ->has('types', 5)
            ->has('risks', 3),
        );
});

test('authenticated staff can create a manual anomaly for review', function () {
    Schema::create('fraud_alert', function (Blueprint $table) {
        $table->id();
        $table->char('npwp', 16);
        $table->char('kode_badan_usaha', 8)->nullable();
        $table->char('nik', 16)->nullable();
        $table->string('jenis_anomali', 40);
        $table->unsignedSmallInteger('masa_pajak')->nullable();
        $table->unsignedSmallInteger('tahun_pajak')->nullable();
        $table->decimal('nilai_bpjs', 17, 2)->nullable();
        $table->decimal('nilai_pembanding', 17, 2)->nullable();
        $table->decimal('selisih', 17, 2)->nullable();
        $table->string('tingkat_risiko', 10);
        $table->string('status_tindak_lanjut', 15)->default('BARU');
        $table->text('keterangan')->nullable();
        $table->timestamp('created_at')->useCurrent();
    });

    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('anomalies.store'), [
        'npwp' => '1234567890123456',
        'type' => 'PDUK',
        'risk' => 'TINGGI',
        'month' => 3,
        'year' => 2026,
        'summary' => 'Data pekerja perlu diverifikasi.',
    ]);

    $response->assertRedirect(route('anomalies.index'));
    $this->assertDatabaseHas('fraud_alert', [
        'npwp' => '1234567890123456',
        'jenis_anomali' => 'PDUK',
        'tingkat_risiko' => 'TINGGI',
        'status_tindak_lanjut' => 'BARU',
        'masa_pajak' => 3,
        'tahun_pajak' => 2026,
        'keterangan' => '{"summary":"Data pekerja perlu diverifikasi.","source":"manual"}',
    ]);
    $this->assertDatabaseHas('fraud_alert_workflows', [
        'fraud_alert_id' => 1,
        'status' => 'waiting_review',
    ]);
    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action' => 'anomaly.manual_created',
        'resource' => 'fraud_alert',
        'resource_id' => '1',
    ]);
});

test('manual anomaly creation validates the submitted values', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('anomalies.store'), [
        'npwp' => 'not-a-valid-npwp',
        'type' => 'UNKNOWN',
        'risk' => 'CRITICAL',
        'month' => 13,
        'year' => 2027,
        'summary' => '',
    ]);

    $response->assertSessionHasErrors([
        'npwp',
        'type',
        'risk',
        'month',
        'year',
        'summary',
    ]);
    $this->assertDatabaseCount('audit_logs', 0);
});

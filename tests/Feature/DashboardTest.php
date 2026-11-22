<?php

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Schema::create('kemnaker_perusahaan', function (Blueprint $table) {
        $table->char('nib', 13)->primary();
        $table->char('npwp', 16)->unique();
        $table->string('provinsi', 80);
        $table->string('status_aktif', 10)->default('AKTIF');
    });

    Schema::create('fraud_alert', function (Blueprint $table) {
        $table->id();
        $table->char('npwp', 16);
        $table->string('jenis_anomali', 40);
        $table->string('tingkat_risiko', 10);
        $table->unsignedSmallInteger('tahun_pajak')->nullable();
        $table->unsignedSmallInteger('masa_pajak')->nullable();
    });
});

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard returns filtered fraud alert counts grouped by province', function () {
    DB::table('kemnaker_perusahaan')->insert([
        ['nib' => '1000000000001', 'npwp' => '0000000000000001', 'provinsi' => 'JAWA TIMUR', 'status_aktif' => 'AKTIF'],
        ['nib' => '1000000000002', 'npwp' => '0000000000000002', 'provinsi' => 'JAWA TIMUR', 'status_aktif' => 'AKTIF'],
        ['nib' => '1000000000003', 'npwp' => '0000000000000003', 'provinsi' => 'JAWA BARAT', 'status_aktif' => 'AKTIF'],
        ['nib' => '1000000000004', 'npwp' => '0000000000000004', 'provinsi' => 'BANTEN', 'status_aktif' => 'TUTUP'],
        ['nib' => '1000000000005', 'npwp' => '0000000000000005', 'provinsi' => 'JAWA BARAT', 'status_aktif' => 'AKTIF'],
    ]);

    DB::table('fraud_alert')->insert([
        ['npwp' => '0000000000000001', 'jenis_anomali' => 'PDUK', 'tingkat_risiko' => 'TINGGI', 'tahun_pajak' => 2026, 'masa_pajak' => 3],
        ['npwp' => '0000000000000001', 'jenis_anomali' => 'PDUK', 'tingkat_risiko' => 'TINGGI', 'tahun_pajak' => 2026, 'masa_pajak' => 3],
        ['npwp' => '0000000000000001', 'jenis_anomali' => 'PDUK', 'tingkat_risiko' => 'TINGGI', 'tahun_pajak' => 2026, 'masa_pajak' => 2],
        ['npwp' => '0000000000000002', 'jenis_anomali' => 'PDUK', 'tingkat_risiko' => 'TINGGI', 'tahun_pajak' => 2026, 'masa_pajak' => 3],
        ['npwp' => '0000000000000003', 'jenis_anomali' => 'PDUK', 'tingkat_risiko' => 'TINGGI', 'tahun_pajak' => 2026, 'masa_pajak' => 3],
        ['npwp' => '0000000000000004', 'jenis_anomali' => 'PDUK', 'tingkat_risiko' => 'TINGGI', 'tahun_pajak' => 2026, 'masa_pajak' => 3],
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('dashboard', ['period' => '2026-03']));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('caseCountsByProvince', 2)
            ->where('caseCountsByProvince.0', [
                'province' => 'JAWA BARAT',
                'caseCount' => 1,
            ])
            ->where('caseCountsByProvince.1', [
                'province' => 'JAWA TIMUR',
                'caseCount' => 3,
            ])
            ->where('summary.totalCompanies', 4)
            ->where('summary.anomalyCompanies', 3),
        );
});

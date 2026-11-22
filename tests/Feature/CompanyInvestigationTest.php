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
        $table->string('nama_perusahaan', 200);
        $table->string('kab_kota', 80);
        $table->string('provinsi', 80);
        $table->char('kode_kab_kota', 4);
        $table->string('status_aktif', 10)->default('AKTIF');
    });

    Schema::create('bpjs_badan_usaha', function (Blueprint $table) {
        $table->char('kode_badan_usaha', 8)->primary();
        $table->char('npwp', 16)->unique();
    });

    Schema::create('bpjs_peserta', function (Blueprint $table) {
        $table->char('no_kartu', 13)->primary();
        $table->char('nik', 16);
        $table->char('kode_badan_usaha', 8);
        $table->string('status_hubungan_kerja_dilaporkan', 20);
        $table->decimal('upah_dilaporkan', 15, 2);
        $table->date('tanggal_efektif');
        $table->string('status_peserta', 10);
    });

    Schema::create('kemnaker_wlkp', function (Blueprint $table) {
        $table->id();
        $table->char('nib', 13);
        $table->unsignedSmallInteger('tahun_lapor');
        $table->integer('jumlah_tk_total');
        $table->date('per_tanggal');
    });

    Schema::create('djp_bukti_potong_pph21', function (Blueprint $table) {
        $table->string('no_bukti_potong', 30)->primary();
        $table->char('npwp_pemotong', 16);
        $table->char('nik_penerima', 16);
        $table->unsignedSmallInteger('masa_pajak');
        $table->unsignedSmallInteger('tahun_pajak');
        $table->decimal('penghasilan_bruto', 15, 2);
        $table->date('tanggal_pemotongan');
        $table->string('status_bukti', 12);
    });

    Schema::create('dukcapil_penduduk', function (Blueprint $table) {
        $table->char('nik', 16)->primary();
        $table->string('status_kependudukan', 10);
    });

    Schema::create('kemnaker_tenaga_kerja', function (Blueprint $table) {
        $table->id();
        $table->char('nib', 13);
        $table->char('nik', 16);
        $table->string('status_hubungan_kerja', 15);
        $table->string('status_kerja', 15);
        $table->date('tanggal_berhenti')->nullable();
    });

    Schema::create('bpjs_mutasi_peserta', function (Blueprint $table) {
        $table->id();
        $table->char('kode_badan_usaha', 8);
        $table->char('nik', 16);
        $table->string('jenis_mutasi', 25);
        $table->date('tanggal_mutasi');
    });

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
        $table->timestamp('created_at')->nullable();
    });

    config([
        'bsafe.detection.employment_status_map' => [
            'kemnaker_to_bpjs' => [
                'KEMITRAAN' => 'PEKERJA_LEPAS',
            ],
            'djp_to_bpjs' => [
                'PEGAWAI_TETAP' => 'PEKERJA_TETAP',
                'BUKAN_PEGAWAI' => 'PEKERJA_LEPAS',
            ],
        ],
    ]);
});

it('renders the selected company with source-derived comparisons and findings', function () {
    $seed = seedCompanyInvestigationData();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('companies.cases.show', [
        'company' => $seed['nib'],
        'fraudAlert' => $seed['pdukId'],
        'q' => 'Mitra Sejahtera',
        'page' => 2,
    ]));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('companies/show')
            ->where('company.nib', $seed['nib'])
            ->where('company.npwp', $seed['npwp'])
            ->where('company.bpjsWorkerCount', 1)
            ->where('case.id', $seed['pdukId'])
            ->where('riskScore.score', 85)
            ->has('comparisons', 5)
            ->where('comparisons.0.differenceLabel', '-Rp 5.000.000')
            ->where('comparisons.1.differenceLabel', '-1 orang')
            ->where('comparisons.2.state', 'match')
            ->where('comparisons.4.result', 'Jumlah NIK valid sama; ini tidak membuktikan jumlah pekerja terdaftar sama.')
            ->where('findings.0.title', 'Perbedaan jumlah pekerja perlu diverifikasi')
            ->where('findings.1.title', 'Indikasi perbedaan pelaporan upah')
            ->where('backUrl', fn (string $url): bool => str_contains($url, 'q=Mitra%20Sejahtera')
                && str_contains($url, 'page=2')),
        );
});

it('returns 404 when a case belongs to a different company', function () {
    $seed = seedCompanyInvestigationData();
    DB::table('kemnaker_perusahaan')->insert([
        'nib' => '8120010000001',
        'npwp' => '0123456789012346',
        'nama_perusahaan' => 'Perusahaan lain',
        'kab_kota' => 'Bandung',
        'provinsi' => 'JAWA BARAT',
        'kode_kab_kota' => '3201',
        'status_aktif' => 'AKTIF',
    ]);

    $this->actingAs(User::factory()->create())
        ->get(route('companies.cases.show', [
            'company' => '8120010000001',
            'fraudAlert' => $seed['pdukId'],
        ]))
        ->assertNotFound();
});

it('links anomaly rows to the selected company and case while preserving filters', function () {
    $seed = seedCompanyInvestigationData();

    $response = $this->actingAs(User::factory()->create())
        ->get(route('anomalies.index', [
            'q' => 'Mitra Sejahtera',
            'period' => '2026-03',
        ]));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('anomalies.data.0.company.detailUrl', fn (string $url): bool => str_contains(
                $url,
                "/companies/{$seed['nib']}/cases/{$seed['pdukId']}",
            ) && str_contains($url, 'period=2026-03'))
        );
});

it('persists status changes and records the authenticated actor', function () {
    $seed = seedCompanyInvestigationData();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patch(
        route('anomalies.status.update', $seed['pdukId']),
        [
            'status' => 'field_audit_priority',
            'notes' => 'Verifikasi lapangan diperlukan.',
        ],
    );

    $response->assertRedirect();
    $this->assertDatabaseHas('fraud_alert_workflows', [
        'fraud_alert_id' => $seed['pdukId'],
        'status' => 'field_audit_priority',
    ]);
    $this->assertDatabaseHas('anomaly_follow_ups', [
        'fraud_alert_id' => $seed['pdukId'],
        'user_id' => $user->id,
        'previous_status' => 'waiting_review',
        'new_status' => 'field_audit_priority',
        'notes' => 'Verifikasi lapangan diperlukan.',
    ]);
});

it('creates a warning letter draft without claiming that it was sent', function () {
    $seed = seedCompanyInvestigationData();
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('anomalies.warning-letter.store', $seed['pdukId']));
    $response->assertRedirect();

    $letter = DB::table('warning_letters')->first();

    expect($letter)->not->toBeNull()
        ->and($letter->status)->toBe('draft')
        ->and(json_decode($letter->preview_data, true)['notice'])
        ->toBe('DRAF — belum disetujui atau dikirim.');

    $this->assertDatabaseHas('anomaly_follow_ups', [
        'fraud_alert_id' => $seed['pdukId'],
        'user_id' => $user->id,
        'action_type' => 'warning_letter_drafted',
    ]);
});

it('downloads a PDF for the selected company and case', function () {
    $seed = seedCompanyInvestigationData();
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('reports.pdf', $seed['pdukId']));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf')
        ->and($response->headers->get('content-disposition'))
        ->toContain("laporan-investigasi-{$seed['nib']}-2026-03.pdf")
        ->and(substr($response->getContent(), 0, 5))
        ->toBe('%PDF-');

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action' => 'investigation_report.downloaded',
        'resource_id' => (string) $seed['pdukId'],
    ]);
});

function seedCompanyInvestigationData(): array
{
    $company = [
        'nib' => '8120010000000',
        'npwp' => '0123456789012345',
    ];
    $nik = '1234567890123456';

    DB::table('kemnaker_perusahaan')->insert([
        ...$company,
        'nama_perusahaan' => 'PT Mitra Sejahtera Abadi',
        'kab_kota' => 'Jakarta Selatan',
        'provinsi' => 'DKI JAKARTA',
        'kode_kab_kota' => '3171',
        'status_aktif' => 'AKTIF',
    ]);
    DB::table('bpjs_badan_usaha')->insert([
        'kode_badan_usaha' => 'BUS00001',
        'npwp' => $company['npwp'],
    ]);
    DB::table('bpjs_peserta')->insert([
        'no_kartu' => '1234567890123',
        'nik' => $nik,
        'kode_badan_usaha' => 'BUS00001',
        'status_hubungan_kerja_dilaporkan' => 'PEKERJA_LEPAS',
        'upah_dilaporkan' => 3000000,
        'tanggal_efektif' => '2026-01-01',
        'status_peserta' => 'AKTIF',
    ]);
    DB::table('kemnaker_wlkp')->insert([
        'nib' => $company['nib'],
        'tahun_lapor' => 2026,
        'jumlah_tk_total' => 2,
        'per_tanggal' => '2026-03-31',
    ]);
    DB::table('djp_bukti_potong_pph21')->insert([
        'no_bukti_potong' => 'BUKTI-1',
        'npwp_pemotong' => $company['npwp'],
        'nik_penerima' => $nik,
        'masa_pajak' => 3,
        'tahun_pajak' => 2026,
        'penghasilan_bruto' => 8000000,
        'tanggal_pemotongan' => '2026-03-31',
        'status_bukti' => 'NORMAL',
    ]);
    DB::table('dukcapil_penduduk')->insert([
        'nik' => $nik,
        'status_kependudukan' => 'AKTIF',
    ]);
    DB::table('kemnaker_tenaga_kerja')->insert([
        'nib' => $company['nib'],
        'nik' => $nik,
        'status_hubungan_kerja' => 'KEMITRAAN',
        'status_kerja' => 'AKTIF',
    ]);

    $pdukId = DB::table('fraud_alert')->insertGetId([
        'npwp' => $company['npwp'],
        'kode_badan_usaha' => 'BUS00001',
        'jenis_anomali' => 'PDUK',
        'masa_pajak' => 3,
        'tahun_pajak' => 2026,
        'nilai_bpjs' => 1,
        'nilai_pembanding' => 2,
        'selisih' => 1,
        'tingkat_risiko' => 'TINGGI',
        'status_tindak_lanjut' => 'BARU',
        'keterangan' => json_encode([
            'summary' => 'Jumlah pekerja BPJS lebih rendah dari data pembanding.',
            'bpjs_count' => 1,
            'wlkp_count' => 2,
            'tax_count' => 2,
            'reference_count' => 2,
            'gap_ratio' => 0.5,
        ], JSON_THROW_ON_ERROR),
        'created_at' => '2026-03-31 12:00:00',
    ]);
    DB::table('fraud_alert')->insert([
        'npwp' => $company['npwp'],
        'kode_badan_usaha' => 'BUS00001',
        'jenis_anomali' => 'UNDER_REPORTING_UPAH',
        'masa_pajak' => 3,
        'tahun_pajak' => 2026,
        'nilai_bpjs' => 3000000,
        'nilai_pembanding' => 8000000,
        'selisih' => 5000000,
        'tingkat_risiko' => 'TINGGI',
        'status_tindak_lanjut' => 'BARU',
        'keterangan' => json_encode([
            'summary' => 'Dasar upah BPJS lebih rendah dari penghasilan PPh 21.',
            'matched_workers' => 1,
            'affected_workers' => 1,
        ], JSON_THROW_ON_ERROR),
        'created_at' => '2026-03-31 12:00:00',
    ]);
    DB::table('company_risk_scores')->insert([
        'company_npwp' => $company['npwp'],
        'tahun' => 2026,
        'masa' => 3,
        'score' => 85,
        'level' => 'TINGGI',
        'breakdown' => json_encode(['method' => 'weighted_sum'], JSON_THROW_ON_ERROR),
        'generated_at' => '2026-03-31 12:00:00',
    ]);

    return [
        ...$company,
        'pdukId' => $pdukId,
    ];
}

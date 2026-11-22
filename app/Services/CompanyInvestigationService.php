<?php

namespace App\Services;

use App\Enums\AnomalyType;
use App\Enums\CaseStatus;
use App\Enums\RiskLevel;
use App\Models\Company;
use App\Models\CompanyRiskScore;
use App\Models\FraudAlert;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CompanyInvestigationService
{
    private const RELATIONSHIP_LABELS = [
        'PEKERJA_TETAP' => 'Tetap',
        'PEKERJA_KONTRAK' => 'Kontrak',
        'PEKERJA_LEPAS' => 'Lepas/mitra',
    ];

    /**
     * @return array<string, mixed>
     */
    public function build(
        Company $company,
        FraudAlert $fraudAlert,
        FraudAlertPresenter $presenter,
    ): array {
        $fraudAlert->setRelation('company', $company);
        $fraudAlert->loadCount('followUps');
        $fraudAlert->loadMissing([
            'workflow',
            'followUps' => fn ($query) => $query->latest()->limit(10),
            'followUps.user',
        ]);

        $businessCode = DB::table('bpjs_badan_usaha')
            ->where('npwp', trim((string) $company->npwp))
            ->value('kode_badan_usaha');
        $businessCode = is_string($businessCode) ? trim($businessCode) : null;
        $year = $fraudAlert->tahun_pajak;
        $month = $fraudAlert->masa_pajak;
        $periodAlerts = $this->periodAlerts($company, $fraudAlert);
        $participantGroups = $this->participantGroups($businessCode);
        $bpjsWorkerCount = $businessCode === null
            ? null
            : (int) $participantGroups->sum('worker_count');
        $bpjsAverageWage = $bpjsWorkerCount > 0
            ? $participantGroups->sum(
                fn (object $group): float => (int) $group->worker_count * (float) $group->average_wage,
            ) / $bpjsWorkerCount
            : null;
        $bpjsReferenceDate = $participantGroups
            ->pluck('latest_effective_date')
            ->filter()
            ->max();
        $wlkp = $this->wlkpReport($company, $year);
        $riskScore = $this->riskScore($company, $year, $month);
        $wageData = $this->wageData($company, $businessCode, $year, $month);
        $wageAlert = $this->alertOfType($periodAlerts, AnomalyType::UnderReportingWage);
        $pdukAlert = $this->alertOfType($periodAlerts, AnomalyType::Pduk);
        $misclassificationAlert = $this->alertOfType($periodAlerts, AnomalyType::EmploymentMisclassification);
        $pdukEvidence = $pdukAlert === null ? [] : $this->evidence($pdukAlert);
        $pdukWorkforceDetected = $this->isSystemAlert($pdukAlert)
            && is_numeric($pdukEvidence['bpjs_count'] ?? null)
            && is_numeric($pdukEvidence['wlkp_count'] ?? null)
            && is_numeric($pdukEvidence['reference_count'] ?? null)
            && (int) $pdukEvidence['bpjs_count'] === $bpjsWorkerCount
            && (int) $pdukEvidence['wlkp_count'] === (int) $pdukEvidence['reference_count'];

        $identity = $this->identityCounts($company, $businessCode);
        $comparisons = [
            $this->wageComparison($wageData, $wageAlert, $bpjsAverageWage, $year, $month),
            $this->workforceComparison(
                $bpjsWorkerCount,
                $wlkp,
                $pdukWorkforceDetected,
                $bpjsReferenceDate,
            ),
            $this->relationshipComparison(
                $company,
                $businessCode,
                $this->isSystemAlert($misclassificationAlert),
            ),
            $this->mutationComparison(
                $company,
                $businessCode,
                $year,
                $month,
            ),
            $this->identityComparison($bpjsWorkerCount, $identity),
        ];

        $case = $presenter->present($fraudAlert);
        $case['company'] = $presenter->companyData($company);
        $findings = $this->findings(
            $fraudAlert,
            $periodAlerts,
            $presenter,
            $bpjsWorkerCount,
            $identity,
            $wageAlert,
            $pdukAlert,
        );
        $riskLevel = RiskLevel::tryFrom((string) ($riskScore?->level ?? $fraudAlert->tingkat_risiko));
        $caseStatus = CaseStatus::tryFrom((string) $case['status']);
        $comparisonByKey = collect($comparisons)->keyBy('key');
        $riskIndicators = [
            [
                'label' => 'Selisih rata-rata upah',
                'value' => $comparisonByKey->get('wage')['differenceLabel']
                    ?? $comparisonByKey->get('wage')['sourceReference']
                    ?? 'Data belum tersedia',
                'state' => $comparisonByKey->get('wage')['state'],
            ],
            [
                'label' => 'Selisih jumlah pekerja',
                'value' => $comparisonByKey->get('workforce')['differenceLabel']
                    ?? $comparisonByKey->get('workforce')['sourceReference']
                    ?? 'Data belum tersedia',
                'state' => $comparisonByKey->get('workforce')['state'],
            ],
            [
                'label' => 'Validasi identitas pekerja (NIK)',
                'value' => $comparisonByKey->get('identity')['result'],
                'state' => $comparisonByKey->get('identity')['state'],
            ],
        ];

        return [
            'company' => [
                'name' => trim((string) $company->nama_perusahaan),
                'nib' => trim((string) $company->nib) ?: null,
                'npwp' => trim((string) $company->npwp) ?: null,
                'city' => trim((string) $company->kab_kota) ?: null,
                'province' => trim((string) $company->provinsi) ?: null,
                'bpjsWorkerCount' => $bpjsWorkerCount,
            ],
            'case' => [
                'id' => $fraudAlert->id,
                'type' => $case['type'],
                'typeLabel' => $case['typeLabel'],
                'period' => $case['period'],
                'summary' => $case['summary'],
                'status' => $case['status'],
                'statusLabel' => $case['statusLabel'],
                'risk' => $riskLevel?->value,
                'riskLabel' => $riskLevel?->label() ?? 'Belum dinilai',
                'auditPrioritized' => $case['auditPrioritized'],
            ],
            'riskScore' => [
                'score' => $riskScore === null ? null : (float) $riskScore->score,
                'level' => $riskLevel?->value,
                'levelLabel' => $riskLevel?->label() ?? 'Belum dinilai',
                'generatedAt' => $riskScore?->generated_at?->toIso8601String(),
                'breakdown' => $riskScore?->breakdown,
            ],
            'comparisons' => $comparisons,
            'riskIndicators' => $riskIndicators,
            'findings' => $findings,
            'recommendation' => $this->recommendation($findings, $caseStatus),
            'history' => $fraudAlert->followUps
                ->map(fn ($followUp): array => $presenter->presentFollowUp($followUp))
                ->all(),
            'historyCount' => (int) $fraudAlert->follow_ups_count,
        ];
    }

    /**
     * @return Collection<int, FraudAlert>
     */
    private function periodAlerts(Company $company, FraudAlert $fraudAlert): Collection
    {
        $query = FraudAlert::query()
            ->where('npwp', trim((string) $company->npwp));
        $query->with('workflow');

        $fraudAlert->tahun_pajak === null
            ? $query->whereNull('tahun_pajak')
            : $query->where('tahun_pajak', $fraudAlert->tahun_pajak);
        $fraudAlert->masa_pajak === null
            ? $query->whereNull('masa_pajak')
            : $query->where('masa_pajak', $fraudAlert->masa_pajak);

        $alerts = $query->get([
            'id',
            'npwp',
            'jenis_anomali',
            'masa_pajak',
            'tahun_pajak',
            'tingkat_risiko',
            'status_tindak_lanjut',
            'nilai_bpjs',
            'nilai_pembanding',
            'selisih',
            'keterangan',
        ]);
        $alerts->each(fn (FraudAlert $alert) => $alert->setRelation('company', $company));

        return $alerts;
    }

    /**
     * @return Collection<int, object>
     */
    private function participantGroups(?string $businessCode): Collection
    {
        if ($businessCode === null) {
            return collect();
        }

        return DB::table('bpjs_peserta')
            ->where('kode_badan_usaha', $businessCode)
            ->where('status_peserta', 'AKTIF')
            ->select('status_hubungan_kerja_dilaporkan')
            ->selectRaw('COUNT(DISTINCT nik) AS worker_count')
            ->selectRaw('AVG(upah_dilaporkan) AS average_wage')
            ->selectRaw('MAX(tanggal_efektif) AS latest_effective_date')
            ->groupBy('status_hubungan_kerja_dilaporkan')
            ->get();
    }

    private function wlkpReport(Company $company, ?int $year): ?object
    {
        $query = DB::table('kemnaker_wlkp')
            ->where('nib', trim((string) $company->nib));

        if ($year !== null) {
            $query->where('tahun_lapor', $year);
        } else {
            $query->orderByDesc('tahun_lapor');
        }

        return $query->first(['tahun_lapor', 'jumlah_tk_total', 'per_tanggal']);
    }

    private function riskScore(Company $company, ?int $year, ?int $month): ?CompanyRiskScore
    {
        $query = CompanyRiskScore::query()
            ->where('company_npwp', trim((string) $company->npwp));

        $year === null
            ? $query->whereNull('tahun')
            : $query->where('tahun', $year);
        $month === null
            ? $query->whereNull('masa')
            : $query->where('masa', $month);

        return $query->latest('generated_at')
            ->first(['score', 'level', 'breakdown', 'generated_at']);
    }

    private function wageData(
        Company $company,
        ?string $businessCode,
        ?int $year,
        ?int $month,
    ): ?object {
        if ($businessCode === null || $year === null || $month === null) {
            return null;
        }

        return DB::table('djp_bukti_potong_pph21 as tax')
            ->join('bpjs_peserta as participant', function (JoinClause $join) use ($businessCode): void {
                $join->on('participant.nik', '=', 'tax.nik_penerima')
                    ->where('participant.kode_badan_usaha', '=', $businessCode)
                    ->where('participant.status_peserta', '=', 'AKTIF');
            })
            ->join('dukcapil_penduduk as person', function (JoinClause $join): void {
                $join->on('person.nik', '=', 'participant.nik')
                    ->where('person.status_kependudukan', '=', 'AKTIF');
            })
            ->where('tax.npwp_pemotong', trim((string) $company->npwp))
            ->where('tax.tahun_pajak', $year)
            ->where('tax.masa_pajak', $month)
            ->where('tax.status_bukti', '!=', 'PEMBATALAN')
            ->where('tax.penghasilan_bruto', '>', 0)
            ->selectRaw('AVG(participant.upah_dilaporkan) AS bpjs_average')
            ->selectRaw('AVG(tax.penghasilan_bruto) AS tax_average')
            ->selectRaw('COUNT(DISTINCT participant.nik) AS matched_workers')
            ->selectRaw('MAX(tax.tanggal_pemotongan) AS reference_date')
            ->first();
    }

    /**
     * @param  Collection<int, FraudAlert>  $alerts
     */
    private function alertOfType(Collection $alerts, AnomalyType $type): ?FraudAlert
    {
        $alert = $alerts->firstWhere('jenis_anomali', $type->value);

        return $alert instanceof FraudAlert ? $alert : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function wageComparison(
        ?object $wageData,
        ?FraudAlert $wageAlert,
        ?float $bpjsCurrentAverage,
        ?int $year,
        ?int $month,
    ): array {
        $hasDetectedValues = $this->isSystemAlert($wageAlert)
            && is_numeric($wageAlert->nilai_bpjs)
            && is_numeric($wageAlert->nilai_pembanding);
        $bpjsAverage = $hasDetectedValues
            ? (float) $wageAlert->nilai_bpjs
            : (is_numeric($wageData?->bpjs_average)
                ? (float) $wageData->bpjs_average
                : $bpjsCurrentAverage);
        $taxAverage = $hasDetectedValues
            ? (float) $wageAlert->nilai_pembanding
            : (is_numeric($wageData?->tax_average) ? (float) $wageData->tax_average : null);

        if ($bpjsAverage === null || $taxAverage === null) {
            $row = $this->unavailableRow('wage', 'Rata-rata upah', 'DJP PPh21');
            $row['bpjsValue'] = $bpjsAverage === null ? null : $this->rupiah($bpjsAverage);
            $row['sourceReference'] = 'Data upah pada periode kasus belum tersedia di DJP PPh21.';

            return $row;
        }

        $difference = $bpjsAverage - $taxAverage;
        $detected = $hasDetectedValues;
        $state = abs($difference) < 0.01
            ? 'match'
            : ($detected ? 'mismatch' : 'warning');
        $matchedWorkers = is_numeric($wageData?->matched_workers)
            ? (int) $wageData->matched_workers
            : null;
        $referenceDate = $wageData?->reference_date;

        return [
            'key' => 'wage',
            'label' => 'Rata-rata upah',
            'bpjsValue' => $this->rupiah($bpjsAverage),
            'comparisonValue' => 'DJP PPh21: '.$this->rupiah($taxAverage),
            'sourceName' => 'DJP PPh21',
            'sourceReference' => $referenceDate
                ? 'Tanggal pemotongan terakhir: '.$referenceDate
                : $this->periodLabel($year, $month),
            'difference' => $difference,
            'differenceLabel' => $this->signedRupiah($difference),
            'result' => $state === 'match'
                ? 'Sesuai'
                : $this->signedRupiah($difference).' · '.($detected
                    ? 'indikasi sistem'
                    : 'perlu diverifikasi'),
            'state' => $state,
            'detected' => $detected,
            'matchedWorkers' => $matchedWorkers,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function workforceComparison(
        ?int $bpjsWorkerCount,
        ?object $wlkp,
        bool $detected,
        ?string $bpjsReferenceDate,
    ): array {
        $wlkpCount = $wlkp === null ? null : (int) $wlkp->jumlah_tk_total;

        if ($bpjsWorkerCount === null || $wlkpCount === null) {
            $row = $this->unavailableRow('workforce', 'Jumlah pekerja', 'WLKP Kemenaker');
            $row['bpjsValue'] = $bpjsWorkerCount === null ? null : $this->people($bpjsWorkerCount);
            $row['sourceReference'] = 'Data pembanding WLKP Kemenaker belum tersedia untuk periode kasus.';

            return $row;
        }

        $difference = $bpjsWorkerCount - $wlkpCount;
        $state = $difference === 0 ? 'match' : ($detected ? 'mismatch' : 'warning');

        return [
            'key' => 'workforce',
            'label' => 'Jumlah pekerja',
            'bpjsValue' => $this->people($bpjsWorkerCount),
            'comparisonValue' => 'WLKP Kemenaker: '.$this->people($wlkpCount),
            'sourceName' => 'WLKP Kemenaker',
            'sourceReference' => 'Tahun '.$wlkp->tahun_lapor
                .' · per '.($wlkp->per_tanggal ?: 'tanggal tidak tersedia')
                .($bpjsReferenceDate ? ' · BPJS efektif hingga '.$bpjsReferenceDate : ''),
            'difference' => $difference,
            'differenceLabel' => $this->signedPeople($difference),
            'result' => $difference === 0
                ? 'Sesuai'
                : $this->signedPeople($difference).' · '.($detected
                    ? 'indikasi sistem'
                    : 'perlu diverifikasi'),
            'state' => $state,
            'detected' => $detected,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function relationshipComparison(
        Company $company,
        ?string $businessCode,
        bool $detected,
    ): array {
        $mapping = config('bsafe.detection.employment_status_map.kemnaker_to_bpjs');

        if ($businessCode === null || ! is_array($mapping) || $mapping === []) {
            return $this->unavailableRow(
                'relationship',
                'Status hubungan kerja',
                'Kemenaker',
                'Pemetaan status hubungan kerja belum tersedia.',
            );
        }

        $groups = DB::table('kemnaker_tenaga_kerja as worker')
            ->join('bpjs_peserta as participant', function (JoinClause $join) use ($businessCode): void {
                $join->on('participant.nik', '=', 'worker.nik')
                    ->where('participant.kode_badan_usaha', '=', $businessCode)
                    ->where('participant.status_peserta', '=', 'AKTIF');
            })
            ->where('worker.nib', trim((string) $company->nib))
            ->where('worker.status_kerja', 'AKTIF')
            ->select('worker.status_hubungan_kerja', 'participant.status_hubungan_kerja_dilaporkan')
            ->selectRaw('COUNT(DISTINCT worker.nik) AS worker_count')
            ->groupBy('worker.status_hubungan_kerja', 'participant.status_hubungan_kerja_dilaporkan')
            ->get();

        $bpjsCounts = array_fill_keys(array_keys(self::RELATIONSHIP_LABELS), 0);
        $kemnakerCounts = array_fill_keys(array_keys(self::RELATIONSHIP_LABELS), 0);
        $matchedWorkers = 0;

        foreach ($groups as $group) {
            $bpjsStatus = trim((string) $group->status_hubungan_kerja_dilaporkan);
            $kemnakerStatus = trim((string) $group->status_hubungan_kerja);
            $mappedStatus = $mapping[$kemnakerStatus] ?? null;

            if (
                ! array_key_exists($bpjsStatus, $bpjsCounts)
                || ! is_string($mappedStatus)
                || ! array_key_exists($mappedStatus, $kemnakerCounts)
            ) {
                continue;
            }

            $count = (int) $group->worker_count;
            $bpjsCounts[$bpjsStatus] += $count;
            $kemnakerCounts[$mappedStatus] += $count;
            $matchedWorkers += $count;
        }

        if ($matchedWorkers === 0) {
            return $this->unavailableRow(
                'relationship',
                'Status hubungan kerja',
                'Kemenaker',
                'Belum ada pekerja aktif yang cocok di kedua sumber.',
            );
        }

        $bpjsSummary = $this->relationshipSummary($bpjsCounts, $matchedWorkers);
        $kemnakerSummary = $this->relationshipSummary($kemnakerCounts, $matchedWorkers);
        $matches = $bpjsCounts === $kemnakerCounts;
        $state = $matches ? 'match' : ($detected ? 'mismatch' : 'warning');

        return [
            'key' => 'relationship',
            'label' => 'Status hubungan kerja',
            'bpjsValue' => $bpjsSummary,
            'comparisonValue' => 'Kemenaker: '.$kemnakerSummary,
            'sourceName' => 'Kemenaker',
            'sourceReference' => 'Proporsi pada '.$this->people($matchedWorkers).' yang cocok; status Kemenaker dipetakan sesuai konfigurasi B-SAFE.',
            'difference' => null,
            'differenceLabel' => null,
            'result' => $matches
                ? 'Sesuai'
                : ($detected ? 'Indikasi sistem · perlu verifikasi' : 'Distribusi berbeda · perlu verifikasi'),
            'state' => $state,
            'detected' => $detected,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mutationComparison(
        Company $company,
        ?string $businessCode,
        ?int $year,
        ?int $month,
    ): array {
        if ($year === null || $month === null) {
            return $this->unavailableRow(
                'mutations',
                'Mutasi pekerja keluar',
                'Kemenaker',
                'Periode kasus tidak tersedia.',
            );
        }

        $start = sprintf('%04d-%02d-01', $year, $month);
        $end = CarbonImmutable::create($year, $month, 1)->endOfMonth()->toDateString();
        $bpjsQuery = DB::table('bpjs_mutasi_peserta')
            ->where('kode_badan_usaha', $businessCode ?? '')
            ->whereIn('jenis_mutasi', ['NONAKTIF_RESIGN', 'NONAKTIF_PHK', 'NONAKTIF_HABIS_KONTRAK'])
            ->whereBetween('tanggal_mutasi', [$start, $end])
            ->selectRaw('? AS source', ['bpjs'])
            ->selectRaw('COUNT(DISTINCT nik) AS total');
        $kemnakerQuery = DB::table('kemnaker_tenaga_kerja')
            ->where('nib', trim((string) $company->nib))
            ->whereIn('status_kerja', ['RESIGN', 'PHK', 'HABIS_KONTRAK'])
            ->whereBetween('tanggal_berhenti', [$start, $end])
            ->selectRaw('? AS source', ['kemnaker'])
            ->selectRaw('COUNT(DISTINCT nik) AS total');
        $counts = DB::query()
            ->fromSub($bpjsQuery->unionAll($kemnakerQuery), 'exit_counts')
            ->get()
            ->keyBy('source');

        $bpjsCount = $businessCode === null ? null : (int) ($counts->get('bpjs')?->total ?? 0);
        $kemnakerCount = (int) ($counts->get('kemnaker')?->total ?? 0);

        if ($bpjsCount === null) {
            return $this->unavailableRow(
                'mutations',
                'Mutasi pekerja keluar',
                'Kemenaker',
                'Data badan usaha BPJS belum tersedia.',
            );
        }

        $difference = $bpjsCount - $kemnakerCount;
        $state = $difference === 0 ? 'match' : 'warning';

        return [
            'key' => 'mutations',
            'label' => 'Mutasi pekerja keluar',
            'bpjsValue' => $this->people($bpjsCount),
            'comparisonValue' => 'Kemenaker: '.$this->people($kemnakerCount),
            'sourceName' => 'Kemenaker',
            'sourceReference' => 'Tanggal berhenti / mutasi pada '.$this->periodLabel($year, $month),
            'difference' => $difference,
            'differenceLabel' => $this->signedPeople($difference),
            'result' => $difference === 0
                ? 'Sesuai'
                : $this->signedPeople($difference).' · perlu rekonsiliasi',
            'state' => $state,
            'detected' => false,
        ];
    }

    /**
     * @param  array{bpjs: int|null, kemnaker: int}  $identity
     * @return array<string, mixed>
     */
    private function identityComparison(?int $bpjsWorkerCount, array $identity): array
    {
        $bpjsValid = $identity['bpjs'];
        $kemnakerValid = $identity['kemnaker'];

        if ($bpjsWorkerCount === null || $bpjsValid === null) {
            return $this->unavailableRow(
                'identity',
                'Identitas pekerja (NIK)',
                'Dukcapil',
                'Data peserta BPJS belum tersedia.',
            );
        }

        $equal = $bpjsValid === $kemnakerValid;

        return [
            'key' => 'identity',
            'label' => 'Identitas pekerja (NIK)',
            'bpjsValue' => $this->validCount($bpjsValid),
            'comparisonValue' => 'Dukcapil · data Kemenaker: '.$this->validCount($kemnakerValid),
            'sourceName' => 'Dukcapil',
            'sourceReference' => 'Validitas NIK pada data aktif; tanggal pembaruan sumber tidak tersedia.',
            'difference' => $bpjsValid - $kemnakerValid,
            'differenceLabel' => $this->signedPeople($bpjsValid - $kemnakerValid),
            'result' => $equal
                ? 'Jumlah NIK valid sama; ini tidak membuktikan jumlah pekerja terdaftar sama.'
                : 'Validasi Dukcapil menemukan jumlah NIK valid yang berbeda; ini bukan bukti jumlah pekerja terdaftar sama.',
            'state' => $equal ? 'match' : 'warning',
            'detected' => false,
        ];
    }

    /**
     * @return array{bpjs: int|null, kemnaker: int}
     */
    private function identityCounts(Company $company, ?string $businessCode): array
    {
        $bpjsQuery = DB::table('bpjs_peserta as participant')
            ->join('dukcapil_penduduk as person', function (JoinClause $join): void {
                $join->on('person.nik', '=', 'participant.nik')
                    ->where('person.status_kependudukan', '=', 'AKTIF');
            })
            ->where('participant.kode_badan_usaha', $businessCode ?? '')
            ->where('participant.status_peserta', 'AKTIF')
            ->selectRaw('? AS source', ['bpjs'])
            ->selectRaw('COUNT(DISTINCT participant.nik) AS total');
        $kemnakerQuery = DB::table('kemnaker_tenaga_kerja as worker')
            ->join('dukcapil_penduduk as person', function (JoinClause $join): void {
                $join->on('person.nik', '=', 'worker.nik')
                    ->where('person.status_kependudukan', '=', 'AKTIF');
            })
            ->where('worker.nib', trim((string) $company->nib))
            ->where('worker.status_kerja', 'AKTIF')
            ->selectRaw('? AS source', ['kemnaker'])
            ->selectRaw('COUNT(DISTINCT worker.nik) AS total');
        $counts = DB::query()
            ->fromSub($bpjsQuery->unionAll($kemnakerQuery), 'identity_counts')
            ->get()
            ->keyBy('source');

        return [
            'bpjs' => $businessCode === null ? null : (int) ($counts->get('bpjs')?->total ?? 0),
            'kemnaker' => (int) ($counts->get('kemnaker')?->total ?? 0),
        ];
    }

    /**
     * @param  Collection<int, FraudAlert>  $periodAlerts
     * @param  array{bpjs: int|null, kemnaker: int}  $identity
     * @return list<array{title: string, description: string, state: string}>
     */
    private function findings(
        FraudAlert $fraudAlert,
        Collection $periodAlerts,
        FraudAlertPresenter $presenter,
        ?int $bpjsWorkerCount,
        array $identity,
        ?FraudAlert $wageAlert,
        ?FraudAlert $pdukAlert,
    ): array {
        $findings = [];

        if ($this->isSystemAlert($pdukAlert)) {
            $evidence = $this->evidence($pdukAlert);
            $bpjsCount = is_numeric($evidence['bpjs_count'] ?? null)
                ? (int) $evidence['bpjs_count']
                : $bpjsWorkerCount;
            $referenceCount = is_numeric($evidence['reference_count'] ?? null)
                ? (int) $evidence['reference_count']
                : null;

            if ($bpjsCount !== null && $referenceCount !== null && $referenceCount > $bpjsCount) {
                $gap = $referenceCount - $bpjsCount;
                $referenceSource = $this->pdukReferenceSource($evidence);
                $identityNote = $identity['bpjs'] !== null
                    && $bpjsWorkerCount !== null
                    && $bpjsWorkerCount > 0
                    && $bpjsWorkerCount === $bpjsCount
                    && $identity['bpjs'] === $bpjsWorkerCount
                    ? ' Seluruh NIK peserta BPJS aktif yang diperiksa tervalidasi di Dukcapil; selisih ini menunjukkan perbedaan pelaporan dan bukan bukti identitas fiktif.'
                    : ' Selisih jumlah perlu diverifikasi dan tidak dengan sendirinya membuktikan identitas fiktif.';

                $findings[] = [
                    'title' => 'Perbedaan jumlah pekerja perlu diverifikasi',
                    'description' => 'Pada periode kasus, deteksi sistem mencatat '
                        .$this->people($bpjsCount).' di BPJS dan '.$this->people($referenceCount)
                        .' pada '.$referenceSource.' (selisih '.$this->people($gap).').'.$identityNote,
                    'state' => 'warning',
                ];
            }
        }

        if (
            $this->isSystemAlert($wageAlert)
            && is_numeric($wageAlert->nilai_bpjs)
            && is_numeric($wageAlert->nilai_pembanding)
            && (float) $wageAlert->nilai_pembanding > (float) $wageAlert->nilai_bpjs
        ) {
            $bpjsWage = (float) $wageAlert->nilai_bpjs;
            $taxWage = (float) $wageAlert->nilai_pembanding;
            $findings[] = [
                'title' => 'Indikasi perbedaan pelaporan upah',
                'description' => 'Upah rata-rata BPJS tercatat '.$this->rupiah($bpjsWage)
                    .' sedangkan pembanding PPh21 DJP '.$this->rupiah($taxWage)
                    .' (selisih '.$this->rupiah($taxWage - $bpjsWage)
                    .'). Ini merupakan indikasi awal yang perlu diverifikasi, bukan kesimpulan pelanggaran.',
                'state' => 'mismatch',
            ];
        }

        foreach ([
            AnomalyType::EmploymentMisclassification,
            AnomalyType::FictitiousMutation,
            AnomalyType::InvalidIdentity,
        ] as $type) {
            $alert = $this->alertOfType($periodAlerts, $type);

            if ($alert === null) {
                continue;
            }

            $data = $presenter->present($alert);
            $evidence = $data['evidence'];
            $count = $evidence['mismatched_workers'] ?? $evidence['affected_workers'] ?? null;
            $description = $this->isSystemAlert($alert)
                ? (is_numeric($count)
                    ? 'Deteksi sistem mencatat '.$this->people((int) $count).' terdampak. '
                    : 'Deteksi sistem mencatat indikasi awal. ')
                : 'Kasus ini dicatat secara manual. ';

            $findings[] = [
                'title' => ($this->isSystemAlert($alert) ? 'Indikasi ' : 'Catatan ')
                    .$data['typeLabel'],
                'description' => $description
                    .($data['summary'] ?: 'Data lintas sumber perlu diverifikasi sebelum kesimpulan ditetapkan.'),
                'state' => 'warning',
            ];
        }

        $caseEvidence = $presenter->present($fraudAlert)['evidence'];

        if (
            $findings === []
            && ($caseEvidence['source'] ?? null) === 'manual'
            && trim((string) $fraudAlert->keterangan) !== ''
        ) {
            $summary = $presenter->present($fraudAlert)['summary'];

            $findings[] = [
                'title' => 'Kasus dicatat secara manual',
                'description' => $summary ?: 'Catatan kasus tersedia untuk ditinjau.',
                'state' => 'warning',
            ];
        }

        return $findings;
    }

    /**
     * @param  list<array{title: string, description: string, state: string}>  $findings
     */
    private function recommendation(array $findings, ?CaseStatus $status): string
    {
        if ($status === CaseStatus::Completed) {
            return 'Kasus berstatus selesai. Tinjau catatan dan bukti tersimpan sebelum membuka tindak lanjut baru.';
        }

        if ($findings === []) {
            return 'Belum ada rekomendasi tindak lanjut otomatis untuk data pembanding yang tersedia.';
        }

        $titles = collect($findings)
            ->pluck('title')
            ->implode(', ');
        $action = match ($status) {
            CaseStatus::FieldAuditPriority => 'Lanjutkan audit lapangan yang telah diprioritaskan',
            CaseStatus::InReview => 'Lanjutkan peninjauan dan verifikasi',
            default => 'Mulai peninjauan dan verifikasi',
        };

        return $action.' atas '.$titles
            .'. Cocokkan dokumen sumber dan catat hasilnya sebelum menetapkan kesimpulan pemeriksaan.';
    }

    /**
     * @param  array<string, mixed>  $evidence
     */
    private function pdukReferenceSource(array $evidence): string
    {
        $wlkpCount = is_numeric($evidence['wlkp_count'] ?? null)
            ? (int) $evidence['wlkp_count']
            : null;
        $taxCount = is_numeric($evidence['tax_count'] ?? null)
            ? (int) $evidence['tax_count']
            : null;

        if ($wlkpCount !== null && ($taxCount === null || $wlkpCount >= $taxCount)) {
            return 'WLKP Kemenaker';
        }

        if ($taxCount !== null) {
            return 'DJP PPh21';
        }

        return 'data pembanding lintas lembaga';
    }

    /** @param  array<string, int>  $counts */
    private function relationshipSummary(array $counts, int $total): string
    {
        $parts = [];

        foreach (self::RELATIONSHIP_LABELS as $value => $label) {
            $percent = $total === 0 ? 0 : ($counts[$value] / $total) * 100;
            $parts[] = $label.' '.number_format($percent, 1, ',', '.').'%';
        }

        return implode(', ', $parts);
    }

    /**
     * @return array<string, mixed>
     */
    private function unavailableRow(
        string $key,
        string $label,
        string $sourceName,
        ?string $reason = null,
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'bpjsValue' => null,
            'comparisonValue' => null,
            'sourceName' => $sourceName,
            'sourceReference' => $reason,
            'difference' => null,
            'differenceLabel' => null,
            'result' => $reason ?? 'Sumber pembanding belum menyediakan data.',
            'state' => 'unavailable',
            'detected' => false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function evidence(FraudAlert $alert): array
    {
        $decoded = json_decode((string) $alert->keterangan, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function isSystemAlert(?FraudAlert $alert): bool
    {
        return $alert !== null && ($this->evidence($alert)['source'] ?? null) !== 'manual';
    }

    private function periodLabel(?int $year, ?int $month): string
    {
        return $year !== null && $month !== null
            ? sprintf('Periode %04d-%02d', $year, $month)
            : 'Periode data tidak tersedia';
    }

    private function rupiah(float $value): string
    {
        return 'Rp '.number_format($value, 0, ',', '.');
    }

    private function signedRupiah(float $value): string
    {
        $sign = $value < 0 ? '-' : ($value > 0 ? '+' : '');

        return $sign.$this->rupiah(abs($value));
    }

    private function people(int $value): string
    {
        return number_format($value, 0, ',', '.').' orang';
    }

    private function signedPeople(int $value): string
    {
        $sign = $value < 0 ? '-' : ($value > 0 ? '+' : '');

        return $sign.$this->people(abs($value));
    }

    private function validCount(int $value): string
    {
        return number_format($value, 0, ',', '.').' valid';
    }
}

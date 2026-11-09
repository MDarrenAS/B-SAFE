<?php

namespace App\Services\Detection\Rules;

use App\Contracts\DetectionRule;
use App\DTO\AnomalyDraft;
use App\DTO\DetectionContext;
use App\Enums\AnomalyType;
use Illuminate\Support\Facades\DB;
use LogicException;

class UnderReportingWageRule implements DetectionRule
{
    public function assertConfigured(): void
    {
        foreach ([
            'wage_gap_threshold' => 'BSAFE_WAGE_GAP_THRESHOLD',
            'company_wage_gap_threshold' => 'BSAFE_COMPANY_WAGE_GAP_THRESHOLD',
        ] as $key => $environmentKey) {
            $threshold = config("bsafe.detection.{$key}");

            if (! is_numeric($threshold) || (float) $threshold < 0 || (float) $threshold > 1) {
                throw new LogicException("{$environmentKey} harus diatur pada rentang 0 sampai 1.");
            }
        }
    }

    /**
     * @return list<AnomalyDraft>
     */
    public function detect(DetectionContext $context): array
    {
        $this->assertConfigured();
        $wageGapThreshold = (float) config('bsafe.detection.wage_gap_threshold');
        $companyThreshold = (float) config('bsafe.detection.company_wage_gap_threshold');
        $companies = DB::table('kemnaker_perusahaan')
            ->where('status_aktif', 'AKTIF')
            ->get(['npwp']);
        $npwps = $companies->pluck('npwp')->map(fn ($value): string => trim((string) $value))->all();

        if ($npwps === []) {
            return [];
        }

        $businessesByNpwp = DB::table('bpjs_badan_usaha')
            ->whereIn('npwp', $npwps)
            ->get(['npwp', 'kode_badan_usaha'])
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->npwp) => trim((string) $row->kode_badan_usaha),
            ])
            ->all();
        $businessCodes = array_values($businessesByNpwp);

        if ($businessCodes === []) {
            return [];
        }

        $taxRows = DB::table('djp_bukti_potong_pph21')
            ->whereIn('npwp_pemotong', $npwps)
            ->where('tahun_pajak', $context->year)
            ->where('masa_pajak', $context->month)
            ->where('status_bukti', '!=', 'PEMBATALAN')
            ->get(['npwp_pemotong', 'nik_penerima', 'penghasilan_bruto']);
        $validNiks = $taxRows
            ->pluck('nik_penerima')
            ->map(fn ($value): string => trim((string) $value))
            ->filter(fn (string $nik): bool => preg_match('/^\d{16}$/D', $nik) === 1)
            ->unique()
            ->values()
            ->all();
        $verifiedNiks = $validNiks === []
            ? []
            : DB::table('dukcapil_penduduk')
                ->whereIn('nik', $validNiks)
                ->where('status_kependudukan', 'AKTIF')
                ->pluck('nik')
                ->map(fn ($value): string => trim((string) $value))
                ->flip()
                ->all();

        $participants = DB::table('bpjs_peserta')
            ->whereIn('kode_badan_usaha', $businessCodes)
            ->where('status_peserta', 'AKTIF')
            ->get(['kode_badan_usaha', 'nik', 'upah_dilaporkan'])
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->kode_badan_usaha).'|'.trim((string) $row->nik) => (float) $row->upah_dilaporkan,
            ])
            ->all();

        $companyStats = [];

        foreach ($taxRows as $taxRow) {
            $npwp = trim((string) $taxRow->npwp_pemotong);
            $nik = trim((string) $taxRow->nik_penerima);
            $businessCode = $businessesByNpwp[$npwp] ?? null;

            if (
                $businessCode === null
                || ! isset($verifiedNiks[$nik])
                || ! array_key_exists($businessCode.'|'.$nik, $participants)
            ) {
                continue;
            }

            $taxWage = (float) $taxRow->penghasilan_bruto;
            $bpjsWage = $participants[$businessCode.'|'.$nik];

            if ($taxWage <= 0) {
                continue;
            }

            $stats = $companyStats[$npwp] ?? [
                'business_code' => $businessCode,
                'matched' => 0,
                'affected' => 0,
                'bpjs_total' => 0.0,
                'tax_total' => 0.0,
            ];
            $stats['matched']++;
            $gapRatio = max(0, ($taxWage - $bpjsWage) / $taxWage);

            if ($gapRatio >= $wageGapThreshold) {
                $stats['affected']++;
                $stats['bpjs_total'] += $bpjsWage;
                $stats['tax_total'] += $taxWage;
            }

            $companyStats[$npwp] = $stats;
        }

        $drafts = [];

        foreach ($companyStats as $npwp => $stats) {
            $affectedRatio = $stats['affected'] / max(1, $stats['matched']);

            if ($stats['affected'] === 0 || $affectedRatio < $companyThreshold) {
                continue;
            }

            $bpjsAverage = $stats['bpjs_total'] / $stats['affected'];
            $taxAverage = $stats['tax_total'] / $stats['affected'];

            $drafts[] = new AnomalyDraft(
                npwp: $npwp,
                kodeBadanUsaha: $stats['business_code'],
                type: AnomalyType::UnderReportingWage,
                year: $context->year,
                month: $context->month,
                bpjsAmount: round($bpjsAverage, 2),
                comparisonAmount: round($taxAverage, 2),
                difference: round($taxAverage - $bpjsAverage, 2),
                summary: 'Dasar upah BPJS lebih rendah dari penghasilan PPh 21 pada pekerja yang cocok.',
                evidence: [
                    'matched_workers' => $stats['matched'],
                    'affected_workers' => $stats['affected'],
                    'affected_ratio' => round($affectedRatio, 4),
                ],
            );
        }

        return $drafts;
    }
}

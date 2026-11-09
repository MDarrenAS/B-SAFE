<?php

namespace App\Services\Detection\Rules;

use App\Contracts\DetectionRule;
use App\DTO\AnomalyDraft;
use App\DTO\DetectionContext;
use App\Enums\AnomalyType;
use Illuminate\Support\Facades\DB;
use LogicException;

class PdukRule implements DetectionRule
{
    public function assertConfigured(): void
    {
        $threshold = config('bsafe.detection.pduk_threshold');

        if (! is_numeric($threshold) || (float) $threshold < 0 || (float) $threshold > 1) {
            throw new LogicException('BSAFE_PDUK_THRESHOLD harus diatur pada rentang 0 sampai 1.');
        }
    }

    /**
     * @return list<AnomalyDraft>
     */
    public function detect(DetectionContext $context): array
    {
        $this->assertConfigured();
        $threshold = (float) config('bsafe.detection.pduk_threshold');
        $companies = DB::table('kemnaker_perusahaan')
            ->where('status_aktif', 'AKTIF')
            ->get(['nib', 'npwp']);
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

        $memberCounts = DB::table('bpjs_peserta')
            ->where('status_peserta', 'AKTIF')
            ->whereIn('kode_badan_usaha', array_values($businessesByNpwp))
            ->select('kode_badan_usaha')
            ->selectRaw('COUNT(DISTINCT nik) AS worker_count')
            ->groupBy('kode_badan_usaha')
            ->get()
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->kode_badan_usaha) => (int) $row->worker_count,
            ])
            ->all();

        $wlkpCounts = DB::table('kemnaker_wlkp')
            ->where('tahun_lapor', $context->year)
            ->get(['nib', 'jumlah_tk_total'])
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->nib) => (int) $row->jumlah_tk_total,
            ])
            ->all();

        $taxCounts = DB::table('djp_bukti_potong_pph21')
            ->whereIn('npwp_pemotong', $npwps)
            ->where('tahun_pajak', $context->year)
            ->where('masa_pajak', $context->month)
            ->where('status_bukti', '!=', 'PEMBATALAN')
            ->select('npwp_pemotong')
            ->selectRaw('COUNT(DISTINCT nik_penerima) AS worker_count')
            ->groupBy('npwp_pemotong')
            ->get()
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->npwp_pemotong) => (int) $row->worker_count,
            ])
            ->all();

        $drafts = [];

        foreach ($companies as $company) {
            $nib = trim((string) $company->nib);
            $npwp = trim((string) $company->npwp);
            $businessCode = $businessesByNpwp[$npwp] ?? null;
            $bpjsCount = $businessCode === null ? 0 : ($memberCounts[$businessCode] ?? 0);
            $wlkpCount = $wlkpCounts[$nib] ?? 0;
            $taxCount = $taxCounts[$npwp] ?? 0;
            $referenceCount = max($wlkpCount, $taxCount);

            if ($referenceCount === 0) {
                continue;
            }

            $gap = max(0, $referenceCount - $bpjsCount);
            $gapRatio = $gap / $referenceCount;

            if ($gapRatio < $threshold) {
                continue;
            }

            $drafts[] = new AnomalyDraft(
                npwp: $npwp,
                kodeBadanUsaha: $businessCode,
                type: AnomalyType::Pduk,
                year: $context->year,
                month: $context->month,
                bpjsAmount: (float) $bpjsCount,
                comparisonAmount: (float) $referenceCount,
                difference: (float) $gap,
                summary: 'Jumlah pekerja BPJS lebih rendah dari data pembanding.',
                evidence: [
                    'bpjs_count' => $bpjsCount,
                    'wlkp_count' => $wlkpCount,
                    'tax_count' => $taxCount,
                    'reference_count' => $referenceCount,
                    'gap_ratio' => round($gapRatio, 4),
                ],
            );
        }

        return $drafts;
    }
}

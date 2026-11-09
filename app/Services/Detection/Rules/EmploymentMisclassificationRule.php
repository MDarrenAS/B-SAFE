<?php

namespace App\Services\Detection\Rules;

use App\Contracts\DetectionRule;
use App\DTO\AnomalyDraft;
use App\DTO\DetectionContext;
use App\Enums\AnomalyType;
use Illuminate\Support\Facades\DB;
use LogicException;

class EmploymentMisclassificationRule implements DetectionRule
{
    public function assertConfigured(): void
    {
        $mapping = config('bsafe.detection.employment_status_map');

        if (
            ! is_array($mapping)
            || ! is_array($mapping['kemnaker_to_bpjs'] ?? null)
            || ! is_array($mapping['djp_to_bpjs'] ?? null)
            || $mapping['kemnaker_to_bpjs'] === []
            || $mapping['djp_to_bpjs'] === []
        ) {
            throw new LogicException(
                'BSAFE_EMPLOYMENT_STATUS_MAP harus memuat kemnaker_to_bpjs dan djp_to_bpjs yang disetujui.',
            );
        }
    }

    /**
     * @return list<AnomalyDraft>
     */
    public function detect(DetectionContext $context): array
    {
        $this->assertConfigured();
        $mapping = config('bsafe.detection.employment_status_map');
        $kemnakerMap = $mapping['kemnaker_to_bpjs'];
        $djpMap = $mapping['djp_to_bpjs'];
        $companies = DB::table('kemnaker_perusahaan')
            ->where('status_aktif', 'AKTIF')
            ->get(['nib', 'npwp']);
        $npwpByNib = $companies->mapWithKeys(fn (object $company): array => [
            trim((string) $company->nib) => trim((string) $company->npwp),
        ])->all();

        if ($companies->isEmpty()) {
            return [];
        }

        $businessesByNpwp = DB::table('bpjs_badan_usaha')
            ->whereIn('npwp', array_values($npwpByNib))
            ->get(['npwp', 'kode_badan_usaha'])
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->npwp) => trim((string) $row->kode_badan_usaha),
            ])
            ->all();
        $businessCodes = array_values($businessesByNpwp);

        if ($businessCodes === []) {
            return [];
        }

        $workers = DB::table('kemnaker_tenaga_kerja')
            ->whereIn('nib', array_keys($npwpByNib))
            ->where('status_kerja', 'AKTIF')
            ->get(['nib', 'nik', 'status_hubungan_kerja']);
        $participantStatuses = DB::table('bpjs_peserta')
            ->whereIn('kode_badan_usaha', $businessCodes)
            ->where('status_peserta', 'AKTIF')
            ->get(['kode_badan_usaha', 'nik', 'status_hubungan_kerja_dilaporkan'])
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->kode_badan_usaha).'|'.trim((string) $row->nik) => trim((string) $row->status_hubungan_kerja_dilaporkan),
            ])
            ->all();
        $taxRows = DB::table('djp_bukti_potong_pph21 as withholding')
            ->join(
                'djp_ref_objek_pajak_pph21 as tax_object',
                'tax_object.kode_objek_pajak',
                '=',
                'withholding.kode_objek_pajak',
            )
            ->whereIn('withholding.npwp_pemotong', array_values($npwpByNib))
            ->where('withholding.tahun_pajak', $context->year)
            ->where('withholding.masa_pajak', $context->month)
            ->where('withholding.status_bukti', '!=', 'PEMBATALAN')
            ->get([
                'withholding.npwp_pemotong',
                'withholding.nik_penerima',
                'tax_object.kategori',
            ]);
        $taxCategories = [];

        foreach ($taxRows as $taxRow) {
            $key = trim((string) $taxRow->npwp_pemotong).'|'.trim((string) $taxRow->nik_penerima);
            $taxCategories[$key][] = trim((string) $taxRow->kategori);
        }

        $workersByCompany = [];

        foreach ($workers as $worker) {
            $nib = trim((string) $worker->nib);
            $npwp = $npwpByNib[$nib] ?? null;
            $businessCode = $npwp === null ? null : ($businessesByNpwp[$npwp] ?? null);
            $nik = trim((string) $worker->nik);
            $key = $npwp.'|'.$nik;
            $actualStatus = $businessCode === null
                ? null
                : ($participantStatuses[$businessCode.'|'.$nik] ?? null);
            $categories = $taxCategories[$key] ?? [];

            if (
                $npwp === null
                || $businessCode === null
                || $actualStatus === null
                || preg_match('/^\d{16}$/D', $nik) !== 1
                || $categories === []
                || count(array_unique($categories)) !== 1
            ) {
                continue;
            }

            $expectedKemnaker = $kemnakerMap[trim((string) $worker->status_hubungan_kerja)] ?? null;
            $expectedDjp = $djpMap[$categories[0]] ?? null;

            if (! is_string($expectedKemnaker) || ! is_string($expectedDjp)) {
                continue;
            }

            $stats = $workersByCompany[$npwp] ?? [
                'business_code' => $businessCode,
                'matched' => 0,
                'mismatched' => 0,
            ];
            $stats['matched']++;

            if ($actualStatus !== $expectedKemnaker || $actualStatus !== $expectedDjp) {
                $stats['mismatched']++;
            }

            $workersByCompany[$npwp] = $stats;
        }

        $drafts = [];

        foreach ($workersByCompany as $npwp => $stats) {
            if ($stats['mismatched'] === 0) {
                continue;
            }

            $drafts[] = new AnomalyDraft(
                npwp: $npwp,
                kodeBadanUsaha: $stats['business_code'],
                type: AnomalyType::EmploymentMisclassification,
                year: $context->year,
                month: $context->month,
                bpjsAmount: null,
                comparisonAmount: null,
                difference: null,
                summary: 'Status hubungan kerja antar-sumber tidak konsisten.',
                evidence: [
                    'matched_workers' => $stats['matched'],
                    'mismatched_workers' => $stats['mismatched'],
                ],
            );
        }

        return $drafts;
    }
}

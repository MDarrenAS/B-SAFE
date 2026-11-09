<?php

namespace App\Services\Detection\Rules;

use App\Contracts\DetectionRule;
use App\DTO\AnomalyDraft;
use App\DTO\DetectionContext;
use App\Enums\AnomalyType;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class FictitiousMutationRule implements DetectionRule
{
    public function assertConfigured(): void {}

    /**
     * @return list<AnomalyDraft>
     */
    public function detect(DetectionContext $context): array
    {
        $companies = DB::table('bpjs_badan_usaha')
            ->get(['npwp', 'kode_badan_usaha'])
            ->mapWithKeys(fn (object $row): array => [
                trim((string) $row->kode_badan_usaha) => trim((string) $row->npwp),
            ])
            ->all();

        if ($companies === []) {
            return [];
        }

        $inactiveParticipants = DB::table('bpjs_peserta')
            ->whereIn('kode_badan_usaha', array_keys($companies))
            ->where('status_peserta', 'NONAKTIF')
            ->whereNotNull('tanggal_nonaktif')
            ->get(['kode_badan_usaha', 'nik', 'tanggal_nonaktif']);
        $taxRows = DB::table('djp_bukti_potong_pph21')
            ->where('tahun_pajak', $context->year)
            ->where('masa_pajak', $context->month)
            ->where('status_bukti', '!=', 'PEMBATALAN')
            ->get(['npwp_pemotong', 'nik_penerima']);
        $taxIdentities = [];

        foreach ($taxRows as $taxRow) {
            $taxIdentities[
                trim((string) $taxRow->npwp_pemotong).'|'.trim((string) $taxRow->nik_penerima)
            ] = true;
        }

        $affectedByCompany = [];
        $reportingPeriod = CarbonImmutable::create($context->year, $context->month, 1);

        foreach ($inactiveParticipants as $participant) {
            $businessCode = trim((string) $participant->kode_badan_usaha);
            $npwp = $companies[$businessCode] ?? null;
            $nik = trim((string) $participant->nik);

            if (
                $npwp === null
                || preg_match('/^\d{16}$/D', $nik) !== 1
                || ! isset($taxIdentities[$npwp.'|'.$nik])
            ) {
                continue;
            }

            $inactivePeriod = CarbonImmutable::parse($participant->tanggal_nonaktif)->startOfMonth();

            if ($reportingPeriod->lessThanOrEqualTo($inactivePeriod)) {
                continue;
            }

            $affectedByCompany[$npwp] = [
                'business_code' => $businessCode,
                'affected' => ($affectedByCompany[$npwp]['affected'] ?? 0) + 1,
            ];
        }

        $drafts = [];

        foreach ($affectedByCompany as $npwp => $stats) {
            $drafts[] = new AnomalyDraft(
                npwp: $npwp,
                kodeBadanUsaha: $stats['business_code'],
                type: AnomalyType::FictitiousMutation,
                year: $context->year,
                month: $context->month,
                bpjsAmount: null,
                comparisonAmount: null,
                difference: null,
                summary: 'Pekerja yang berstatus nonaktif BPJS masih muncul pada bukti potong PPh 21.',
                evidence: [
                    'affected_workers' => $stats['affected'],
                    'reporting_period' => $context->period(),
                ],
            );
        }

        return $drafts;
    }
}

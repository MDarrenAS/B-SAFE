<?php

namespace App\Services;

use App\Enums\AnomalyType;
use App\Enums\CaseStatus;
use App\Enums\RiskLevel;
use App\Models\AnomalyFollowUp;
use App\Models\Company;
use App\Models\FraudAlert;

class FraudAlertPresenter
{
    public function __construct(private readonly DataMaskingService $masking) {}

    /**
     * @return array<string, mixed>
     */
    public function present(FraudAlert $alert): array
    {
        $alert->loadMissing(['company', 'workflow']);
        $type = AnomalyType::tryFrom((string) $alert->jenis_anomali);
        $risk = RiskLevel::tryFrom((string) $alert->tingkat_risiko);
        $status = $this->statusFor($alert);
        $evidence = $this->masking->evidence($alert->keterangan);
        $summary = $evidence['summary'] ?? null;

        return [
            'id' => $alert->id,
            'company' => $this->companyData($alert->company),
            'type' => $type?->value ?? $alert->jenis_anomali,
            'typeLabel' => $type?->label() ?? 'Anomali lainnya',
            'risk' => $risk?->value ?? 'RENDAH',
            'riskLabel' => $risk?->label() ?? 'Belum dinilai',
            'status' => $status->value,
            'statusLabel' => $status->label(),
            'period' => $alert->tahun_pajak && $alert->masa_pajak
                ? sprintf('%04d-%02d', $alert->tahun_pajak, $alert->masa_pajak)
                : 'Tidak tersedia',
            'summary' => is_string($summary)
                ? $summary
                : $this->masking->text((string) $alert->keterangan),
            'evidence' => $evidence,
            'affectedWorkers' => (int) ($evidence['affected_workers'] ?? 0),
            'createdAt' => $alert->created_at?->toDateTimeString(),
            'auditPrioritized' => (bool) ($alert->workflow?->audit_prioritized ?? false),
            'values' => [
                'bpjs' => $alert->nilai_bpjs === null ? null : 'Disamarkan',
                'comparison' => $alert->nilai_pembanding === null ? null : 'Disamarkan',
                'difference' => $alert->selisih === null ? null : 'Disamarkan',
            ],
        ];
    }

    public function statusFor(FraudAlert $alert): CaseStatus
    {
        $workflowStatus = $alert->workflow?->status;

        if (is_string($workflowStatus) && CaseStatus::tryFrom($workflowStatus) !== null) {
            return CaseStatus::from($workflowStatus);
        }

        return match ((string) $alert->status_tindak_lanjut) {
            'DALAM_REVIEW' => CaseStatus::InReview,
            'TERBUKTI', 'FALSE_POSITIVE' => CaseStatus::Completed,
            default => CaseStatus::WaitingReview,
        };
    }

    /**
     * @return array<string, string|null>
     */
    public function companyData(?Company $company): array
    {
        if ($company === null) {
            return [
                'name' => 'Perusahaan tidak terpetakan',
                'nib' => null,
                'npwp' => null,
                'city' => null,
                'province' => null,
                'regionCode' => null,
                'detailUrl' => null,
            ];
        }

        return [
            'name' => trim((string) $company->nama_perusahaan),
            'nib' => $this->masking->identifier((string) $company->nib),
            'npwp' => $this->masking->identifier((string) $company->npwp),
            'city' => trim((string) $company->kab_kota),
            'province' => trim((string) $company->provinsi),
            'regionCode' => trim((string) $company->kode_kab_kota),
            'detailUrl' => route('companies.show', $company),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentFollowUp(AnomalyFollowUp $followUp): array
    {
        $followUp->loadMissing(['user']);
        $status = $followUp->new_status === null
            ? null
            : CaseStatus::tryFrom($followUp->new_status);

        return [
            'id' => $followUp->id,
            'title' => $followUp->title,
            'notes' => $this->masking->text((string) $followUp->notes),
            'actor' => $followUp->user?->name ?? 'Sistem',
            'statusLabel' => $status?->label(),
            'createdAt' => $followUp->created_at?->toDateTimeString(),
        ];
    }
}

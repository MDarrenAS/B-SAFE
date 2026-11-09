<?php

namespace App\Http\Controllers;

use App\Enums\AnomalyType;
use App\Enums\CaseStatus;
use App\Enums\RiskLevel;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use App\Services\FraudAlertPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AnomalyController extends Controller
{
    public function index(
        Request $request,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): Response {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(array_column(AnomalyType::cases(), 'value'))],
            'risk' => ['nullable', Rule::in(array_column(RiskLevel::cases(), 'value'))],
            'status' => ['nullable', Rule::in(array_column(CaseStatus::cases(), 'value'))],
            'period' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ]);
        $query = FraudAlert::query()
            ->with([
                'company:nib,npwp,nama_perusahaan,kab_kota,provinsi,kode_kab_kota',
                'workflow:id,fraud_alert_id,status,audit_prioritized',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if (($search = trim((string) ($filters['q'] ?? ''))) !== '') {
            $search = mb_strtolower($search);
            $query->where(function (Builder $builder) use ($search): void {
                $builder->whereRaw('LOWER(npwp) LIKE ?', ['%'.$search.'%'])
                    ->orWhereHas('company', function (Builder $companyQuery) use ($search): void {
                        $companyQuery
                            ->whereRaw('LOWER(nama_perusahaan) LIKE ?', ['%'.$search.'%'])
                            ->orWhereRaw('LOWER(nib) LIKE ?', ['%'.$search.'%'])
                            ->orWhereRaw('LOWER(npwp) LIKE ?', ['%'.$search.'%']);
                    });
            });
        }

        if (isset($filters['type'])) {
            $query->where('jenis_anomali', $filters['type']);
        }

        if (isset($filters['risk'])) {
            $query->where('tingkat_risiko', $filters['risk']);
        }

        if (isset($filters['period'])) {
            [$year, $month] = array_map('intval', explode('-', $filters['period']));
            $query->where('tahun_pajak', $year)->where('masa_pajak', $month);
        }

        if (isset($filters['status'])) {
            $status = CaseStatus::from($filters['status']);
            $legacyStatuses = match ($status) {
                CaseStatus::WaitingReview => ['BARU'],
                CaseStatus::InReview => ['DALAM_REVIEW'],
                CaseStatus::FieldAuditPriority => [],
                CaseStatus::Completed => ['TERBUKTI', 'FALSE_POSITIVE'],
            };

            $query->where(function (Builder $builder) use ($status, $legacyStatuses): void {
                $builder->whereHas('workflow', fn (Builder $workflow): Builder => $workflow
                    ->where('status', $status->value));

                if ($legacyStatuses !== []) {
                    $builder->orWhere(function (Builder $legacy) use ($legacyStatuses): void {
                        $legacy->whereDoesntHave('workflow')
                            ->whereIn('status_tindak_lanjut', $legacyStatuses);
                    });
                }
            });
        }

        $auditLog->record(
            $request->user()?->getAuthIdentifier(),
            'anomaly_center.viewed',
            'fraud_alert',
            metadata: [
                'type' => $filters['type'] ?? null,
                'risk' => $filters['risk'] ?? null,
                'period' => $filters['period'] ?? null,
            ],
        );

        return Inertia::render('anomalies/index', [
            'anomalies' => $query->paginate(15)->withQueryString()
                ->through(fn (FraudAlert $alert): array => $presenter->present($alert)),
            'filters' => [
                'q' => $filters['q'] ?? '',
                'type' => $filters['type'] ?? '',
                'risk' => $filters['risk'] ?? '',
                'status' => $filters['status'] ?? '',
                'period' => $filters['period'] ?? '',
            ],
            'types' => collect(AnomalyType::cases())->map(fn (AnomalyType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ])->all(),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\AnomalyType;
use App\Enums\RiskLevel;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use App\Services\FraudAlertPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuditPriorityController extends Controller
{
    public function index(
        Request $request,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): Response {
        $filters = $request->validate([
            'period' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'type' => ['nullable', Rule::in(array_column(AnomalyType::cases(), 'value'))],
            'region' => ['nullable', 'string', 'max:120'],
        ]);
        $query = FraudAlert::query()
            ->with([
                'company:nib,npwp,nama_perusahaan,kab_kota,provinsi,kode_kab_kota',
                'workflow:id,fraud_alert_id,status,audit_prioritized',
            ])
            ->orderByRaw("CASE tingkat_risiko WHEN 'TINGGI' THEN 3 WHEN 'SEDANG' THEN 2 ELSE 1 END DESC")
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if (isset($filters['period'])) {
            [$year, $month] = array_map('intval', explode('-', $filters['period']));
            $query->where('tahun_pajak', $year)->where('masa_pajak', $month);
        }

        if (isset($filters['type'])) {
            $query->where('jenis_anomali', $filters['type']);
        }

        if (isset($filters['region'])) {
            $query->whereHas('company', fn (Builder $company): Builder => $company
                ->where('provinsi', $filters['region']));
        }

        $auditLog->record(
            $request->user()?->getAuthIdentifier(),
            'audit_priority.viewed',
            'fraud_alert',
            metadata: ['period' => $filters['period'] ?? null],
        );

        return Inertia::render('audit-priority/index', [
            'anomalies' => $query->paginate(15)->withQueryString()
                ->through(fn (FraudAlert $alert): array => $presenter->present($alert)),
            'filters' => [
                'period' => $filters['period'] ?? '',
                'type' => $filters['type'] ?? '',
                'region' => $filters['region'] ?? '',
            ],
            'risks' => collect(RiskLevel::cases())->map(fn (RiskLevel $risk): array => [
                'value' => $risk->value,
                'label' => $risk->label(),
            ])->all(),
            'types' => collect(AnomalyType::cases())->map(fn (AnomalyType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ])->all(),
        ]);
    }
}

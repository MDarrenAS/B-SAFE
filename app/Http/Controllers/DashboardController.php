<?php

namespace App\Http\Controllers;

use App\Enums\AnomalyType;
use App\Enums\RiskLevel;
use App\Models\Company;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request, AuditLogService $auditLog): Response
    {
        $filters = $request->validate([
            'period' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ]);
        $query = FraudAlert::query();

        if (isset($filters['period'])) {
            [$year, $month] = array_map('intval', explode('-', $filters['period']));
            $query->where('tahun_pajak', $year)->where('masa_pajak', $month);
        }

        $anomalyCompanies = Company::query()
            ->where('status_aktif', 'AKTIF')
            ->whereIn('npwp', (clone $query)->select('npwp')->distinct())
            ->count();
        $riskRows = (clone $query)
            ->select('tingkat_risiko')
            ->selectRaw('COUNT(DISTINCT npwp) AS company_count')
            ->groupBy('tingkat_risiko')
            ->get()
            ->mapWithKeys(fn (object $row): array => [
                (string) $row->tingkat_risiko => (int) $row->company_count,
            ])
            ->all();
        $typeRows = (clone $query)
            ->select('jenis_anomali')
            ->selectRaw('COUNT(*) AS alert_count')
            ->groupBy('jenis_anomali')
            ->get()
            ->mapWithKeys(fn (object $row): array => [
                (string) $row->jenis_anomali => (int) $row->alert_count,
            ])
            ->all();
        $totalCompanies = Company::query()->where('status_aktif', 'AKTIF')->count();
        $periods = FraudAlert::query()
            ->whereNotNull('tahun_pajak')
            ->whereNotNull('masa_pajak')
            ->select('tahun_pajak', 'masa_pajak')
            ->groupBy('tahun_pajak', 'masa_pajak')
            ->orderByDesc('tahun_pajak')
            ->orderByDesc('masa_pajak')
            ->limit(24)
            ->get()
            ->map(fn (FraudAlert $alert): string => sprintf(
                '%04d-%02d',
                $alert->tahun_pajak,
                $alert->masa_pajak,
            ))
            ->values();

        $auditLog->record(
            $request->user()?->getAuthIdentifier(),
            'dashboard.viewed',
            'dashboard',
            metadata: ['period_filtered' => isset($filters['period'])],
        );

        return Inertia::render('dashboard', [
            'filters' => ['period' => $filters['period'] ?? ''],
            'periods' => $periods,
            'summary' => [
                'totalCompanies' => $totalCompanies,
                'anomalyCompanies' => $anomalyCompanies,
                'complianceRate' => $totalCompanies === 0
                    ? null
                    : round((1 - ($anomalyCompanies / $totalCompanies)) * 100, 1),
                'riskDistribution' => collect(RiskLevel::cases())->map(fn (RiskLevel $level): array => [
                    'value' => $level->value,
                    'label' => $level->label(),
                    'count' => $riskRows[$level->value] ?? 0,
                ])->all(),
                'anomaliesByType' => collect(AnomalyType::cases())->map(fn (AnomalyType $type): array => [
                    'value' => $type->value,
                    'label' => $type->label(),
                    'count' => $typeRows[$type->value] ?? 0,
                ])->all(),
            ],
            'dataSource' => 'Data simulasi dari docs/01_schema.sql',
        ]);
    }
}

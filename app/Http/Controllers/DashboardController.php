<?php

namespace App\Http\Controllers;

use App\Enums\AnomalyType;
use App\Enums\RiskLevel;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request, AuditLogService $auditLog): Response
    {
        $filters = $request->validate([
            'period' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ]);
        $period = isset($filters['period'])
            ? array_map('intval', explode('-', $filters['period']))
            : null;
        $query = FraudAlert::query();

        if ($period !== null) {
            $query->where('tahun_pajak', $period[0])->where('masa_pajak', $period[1]);
        }

        $companyMetrics = DB::table('kemnaker_perusahaan as company')
            ->leftJoin('fraud_alert as alert', function (JoinClause $join) use ($period): void {
                $join->on('alert.npwp', '=', 'company.npwp');

                if ($period !== null) {
                    $join->where('alert.tahun_pajak', $period[0])
                        ->where('alert.masa_pajak', $period[1]);
                }
            })
            ->where('company.status_aktif', 'AKTIF')
            ->select('company.provinsi as province')
            ->selectRaw('COUNT(DISTINCT company.npwp) AS company_count')
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN alert.id IS NOT NULL THEN company.npwp END) AS anomaly_company_count',
            )
            ->selectRaw('COUNT(alert.id) AS case_count')
            ->groupBy('company.provinsi')
            ->orderBy('company.provinsi')
            ->get();
        $totalCompanies = (int) $companyMetrics->sum('company_count');
        $anomalyCompanies = (int) $companyMetrics->sum('anomaly_company_count');
        $caseCountsByProvince = $companyMetrics
            ->filter(fn (object $row): bool => trim((string) $row->province) !== '')
            ->map(fn (object $row): array => [
                'province' => trim((string) $row->province),
                'caseCount' => (int) $row->case_count,
            ])
            ->values()
            ->all();

        $riskAggregates = (clone $query)
            ->selectRaw("'risk' AS aggregate_type, tingkat_risiko AS category, COUNT(DISTINCT npwp) AS aggregate_count")
            ->groupBy('tingkat_risiko')
            ->toBase();
        $typeAggregates = (clone $query)
            ->selectRaw("'type' AS aggregate_type, jenis_anomali AS category, COUNT(*) AS aggregate_count")
            ->groupBy('jenis_anomali')
            ->toBase();
        $aggregateRows = $riskAggregates
            ->unionAll($typeAggregates)
            ->get()
            ->groupBy('aggregate_type');
        $riskRows = $aggregateRows->get('risk', collect())
            ->mapWithKeys(fn (object $row): array => [
                (string) $row->category => (int) $row->aggregate_count,
            ])
            ->all();
        $typeRows = $aggregateRows->get('type', collect())
            ->mapWithKeys(fn (object $row): array => [
                (string) $row->category => (int) $row->aggregate_count,
            ])
            ->all();
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
            'caseCountsByProvince' => $caseCountsByProvince,
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

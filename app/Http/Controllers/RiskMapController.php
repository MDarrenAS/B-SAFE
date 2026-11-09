<?php

namespace App\Http\Controllers;

use App\Enums\AnomalyType;
use App\Services\AuditLogService;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RiskMapController extends Controller
{
    public function index(Request $request, AuditLogService $auditLog): Response
    {
        $filters = $request->validate([
            'period' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'type' => ['nullable', Rule::in(array_column(AnomalyType::cases(), 'value'))],
            'region' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
        ]);
        $periodParts = isset($filters['period'])
            ? array_map('intval', explode('-', $filters['period']))
            : null;

        $query = DB::table('kemnaker_perusahaan as company')
            ->leftJoin('fraud_alert as alert', function (JoinClause $join) use ($filters, $periodParts): void {
                $join->on('alert.npwp', '=', 'company.npwp');

                if ($periodParts !== null) {
                    $join->where('alert.tahun_pajak', $periodParts[0])
                        ->where('alert.masa_pajak', $periodParts[1]);
                }

                if (isset($filters['type'])) {
                    $join->where('alert.jenis_anomali', $filters['type']);
                }
            })
            ->where('company.status_aktif', 'AKTIF')
            ->when(isset($filters['region']), fn ($builder) => $builder
                ->where('company.provinsi', $filters['region']))
            ->when(isset($filters['city']), fn ($builder) => $builder
                ->where('company.kab_kota', $filters['city']))
            ->select([
                'company.kode_kab_kota as region_code',
                'company.kab_kota as city',
                'company.provinsi as province',
            ])
            ->selectRaw('COUNT(DISTINCT company.nib) AS monitored_companies')
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN alert.id IS NOT NULL THEN company.nib END) AS anomaly_companies',
            )
            ->groupBy('company.kode_kab_kota', 'company.kab_kota', 'company.provinsi')
            ->get()
            ->map(function (object $row): array {
                $monitored = (int) $row->monitored_companies;
                $anomalies = (int) $row->anomaly_companies;

                return [
                    'regionCode' => trim((string) $row->region_code),
                    'city' => trim((string) $row->city),
                    'province' => trim((string) $row->province),
                    'monitoredCompanies' => $monitored,
                    'anomalyCompanies' => $anomalies,
                    'ratio' => $monitored === 0 ? 0 : round($anomalies / $monitored, 4),
                ];
            })
            ->sortByDesc('ratio')
            ->values();

        $auditLog->record(
            $request->user()?->getAuthIdentifier(),
            'risk_map.viewed',
            'company_region',
            metadata: [
                'period' => $filters['period'] ?? null,
                'type' => $filters['type'] ?? null,
            ],
        );

        return Inertia::render('risk-map/index', [
            'regions' => $query,
            'filters' => [
                'period' => $filters['period'] ?? '',
                'type' => $filters['type'] ?? '',
                'region' => $filters['region'] ?? '',
                'city' => $filters['city'] ?? '',
            ],
            'types' => collect(AnomalyType::cases())->map(fn (AnomalyType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
            ])->all(),
        ]);
    }
}

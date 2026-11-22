<?php

namespace App\Http\Controllers;

use App\Enums\AnomalyType;
use App\Enums\CaseStatus;
use App\Enums\RiskLevel;
use App\Enums\UserRole;
use App\Models\Company;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use App\Services\CompanyInvestigationService;
use App\Services\FraudAlertPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function show(Request $request, Company $company): RedirectResponse
    {
        $filters = $this->listFilters($request);
        $fraudAlert = FraudAlert::query()
            ->where('npwp', trim((string) $company->npwp))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->firstOrFail();

        return to_route('companies.cases.show', [
            'company' => trim((string) $company->getRouteKey()),
            'fraudAlert' => $fraudAlert->getKey(),
            ...$this->filledFilters($filters),
        ]);
    }

    public function showCase(
        Request $request,
        Company $company,
        FraudAlert $fraudAlert,
        CompanyInvestigationService $investigation,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): Response {
        abort_unless(
            trim((string) $fraudAlert->npwp) === trim((string) $company->npwp),
            404,
        );

        $filters = $this->listFilters($request);
        $data = $investigation->build($company, $fraudAlert, $presenter);
        $user = $request->user();
        abort_unless($user !== null, 403);
        $roleLabel = $user->role === UserRole::Admin ? 'Administrator' : 'Petugas';

        $auditLog->record(
            (int) $user->getAuthIdentifier(),
            'company.investigation_viewed',
            'fraud_alert',
            (string) $fraudAlert->getKey(),
            ['status' => $data['case']['status']],
        );

        return Inertia::render('companies/show', [
            ...$data,
            'backUrl' => route('anomalies.index', $this->filledFilters($filters)),
            'reportPdfUrl' => route('reports.pdf', $fraudAlert),
            'statusOptions' => collect(CaseStatus::cases())
                ->map(fn (CaseStatus $status): array => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ])
                ->all(),
            'actor' => [
                'name' => $user->name,
                'role' => $roleLabel,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function listFilters(Request $request): array
    {
        return $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(array_column(AnomalyType::cases(), 'value'))],
            'risk' => ['nullable', Rule::in(array_column(RiskLevel::cases(), 'value'))],
            'status' => ['nullable', Rule::in(array_column(CaseStatus::cases(), 'value'))],
            'period' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function filledFilters(array $filters): array
    {
        return array_filter($filters, fn (mixed $value): bool => $value !== null && $value !== '');
    }
}

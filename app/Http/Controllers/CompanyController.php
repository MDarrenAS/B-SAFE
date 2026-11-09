<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyRiskScore;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use App\Services\FraudAlertPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function show(
        Request $request,
        Company $company,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): Response {
        $alerts = FraudAlert::query()
            ->where('npwp', $company->npwp)
            ->with([
                'workflow',
                'followUps' => fn ($query) => $query->latest()->limit(3),
                'followUps.user',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $alerts->each(fn (FraudAlert $alert) => $alert->setRelation('company', $company));
        $riskScore = CompanyRiskScore::query()
            ->where('company_npwp', $company->npwp)
            ->orderByDesc('generated_at')
            ->first(['score', 'level', 'breakdown', 'generated_at']);

        $auditLog->record(
            $request->user()?->getAuthIdentifier(),
            'company.investigation_viewed',
            'company',
            metadata: ['case_count' => $alerts->count()],
        );

        return Inertia::render('companies/show', [
            'company' => $presenter->companyData($company),
            'anomalies' => $alerts->map(fn (FraudAlert $alert): array => [
                ...$presenter->present($alert),
                'followUps' => $alert->followUps
                    ->map(fn ($followUp): array => $presenter->presentFollowUp($followUp))
                    ->all(),
            ])->values(),
            'riskScore' => $riskScore === null ? null : [
                'score' => (float) $riskScore->score,
                'level' => $riskScore->level,
                'breakdown' => $riskScore->breakdown,
                'generatedAt' => $riskScore->generated_at?->toDateTimeString(),
            ],
        ]);
    }
}

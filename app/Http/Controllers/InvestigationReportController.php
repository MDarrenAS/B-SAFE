<?php

namespace App\Http\Controllers;

use App\Models\CompanyRiskScore;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use App\Services\FraudAlertPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvestigationReportController extends Controller
{
    public function show(
        Request $request,
        FraudAlert $fraudAlert,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): Response {
        $fraudAlert->load(['company', 'workflow', 'followUps.user']);
        $case = $presenter->present($fraudAlert);
        $riskScore = CompanyRiskScore::query()
            ->where('company_npwp', $fraudAlert->npwp)
            ->where('tahun', $fraudAlert->tahun_pajak)
            ->where('masa', $fraudAlert->masa_pajak)
            ->first(['score', 'level', 'breakdown', 'generated_at']);

        $auditLog->record(
            (int) $request->user()->getAuthIdentifier(),
            'investigation_report.print_viewed',
            'fraud_alert',
            (string) $fraudAlert->getKey(),
        );

        return Inertia::render('reports/show', [
            'case' => $case,
            'riskScore' => $riskScore === null ? null : [
                'score' => (float) $riskScore->score,
                'level' => $riskScore->level,
                'breakdown' => $riskScore->breakdown,
            ],
            'followUps' => $fraudAlert->followUps
                ->map(fn ($followUp): array => $presenter->presentFollowUp($followUp))
                ->all(),
            'preparedBy' => $request->user()->name,
            'preparedAt' => now()->toDateTimeString(),
        ]);
    }
}

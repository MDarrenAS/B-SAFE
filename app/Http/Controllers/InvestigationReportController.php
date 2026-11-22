<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use App\Services\CompanyInvestigationService;
use App\Services\FraudAlertPresenter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InvestigationReportController extends Controller
{
    public function show(
        Request $request,
        FraudAlert $fraudAlert,
        CompanyInvestigationService $investigation,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): Response {
        $data = $this->reportData($fraudAlert, $investigation, $presenter);
        $user = $request->user();
        abort_unless($user !== null, 403);

        $auditLog->record(
            (int) $user->getAuthIdentifier(),
            'investigation_report.viewed',
            'fraud_alert',
            (string) $fraudAlert->getKey(),
        );

        return Inertia::render('reports/show', [
            'investigation' => $data,
            'preparedBy' => $user->name,
            'preparedAt' => now()->toIso8601String(),
            'pdfUrl' => route('reports.pdf', $fraudAlert),
        ]);
    }

    public function download(
        Request $request,
        FraudAlert $fraudAlert,
        CompanyInvestigationService $investigation,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): HttpResponse {
        $data = $this->reportData($fraudAlert, $investigation, $presenter);
        $user = $request->user();
        abort_unless($user !== null, 403);

        $auditLog->record(
            (int) $user->getAuthIdentifier(),
            'investigation_report.downloaded',
            'fraud_alert',
            (string) $fraudAlert->getKey(),
        );

        $identifier = $data['company']['nib'] ?? (string) $fraudAlert->getKey();
        $period = preg_replace('/[^0-9-]/', '', (string) $data['case']['period']);
        $filename = Str::slug('laporan-investigasi-'.$identifier.'-'.$period).'.pdf';

        return Pdf::loadView('reports.investigation', [
            'investigation' => $data,
            'preparedBy' => $user->name,
            'preparedAt' => now()->toIso8601String(),
        ])->setPaper('a4')->download($filename);
    }

    /**
     * @return array<string, mixed>
     */
    private function reportData(
        FraudAlert $fraudAlert,
        CompanyInvestigationService $investigation,
        FraudAlertPresenter $presenter,
    ): array {
        $fraudAlert->loadMissing('company');
        $company = $fraudAlert->company;
        abort_unless($company instanceof Company, 404);

        return $investigation->build($company, $fraudAlert, $presenter);
    }
}

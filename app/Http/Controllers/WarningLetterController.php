<?php

namespace App\Http\Controllers;

use App\Models\AnomalyFollowUp;
use App\Models\FraudAlert;
use App\Models\WarningLetter;
use App\Services\AuditLogService;
use App\Services\FraudAlertPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WarningLetterController extends Controller
{
    public function store(
        Request $request,
        FraudAlert $fraudAlert,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): RedirectResponse {
        $userId = (int) $request->user()->getAuthIdentifier();
        $fraudAlert->load('company');
        $case = $presenter->present($fraudAlert);

        $warningLetter = DB::transaction(function () use ($fraudAlert, $case, $auditLog, $userId): WarningLetter {
            $warningLetter = WarningLetter::query()->create([
                'fraud_alert_id' => $fraudAlert->id,
                'user_id' => $userId,
                'status' => 'draft',
                'preview_data' => [
                    'company' => $case['company'],
                    'type' => $case['typeLabel'],
                    'period' => $case['period'],
                    'summary' => $case['summary'],
                    'created_at' => now()->toDateTimeString(),
                    'notice' => 'DRAF — belum disetujui atau dikirim.',
                ],
            ]);

            AnomalyFollowUp::query()->create([
                'fraud_alert_id' => $fraudAlert->id,
                'user_id' => $userId,
                'action_type' => 'warning_letter_drafted',
                'title' => 'Draf surat peringatan dibuat',
                'notes' => 'Draf belum disetujui atau dikirim.',
            ]);
            $auditLog->record(
                $userId,
                'warning_letter.drafted',
                'warning_letter',
                (string) $warningLetter->getKey(),
                ['fraud_alert_id' => $fraudAlert->id],
            );

            return $warningLetter;
        });

        return to_route('warning-letters.show', $warningLetter);
    }

    public function show(
        Request $request,
        WarningLetter $warningLetter,
        AuditLogService $auditLog,
    ): Response {
        abort_unless($warningLetter->user_id === $request->user()->getAuthIdentifier(), 403);
        $warningLetter->load('fraudAlert.company');
        $auditLog->record(
            (int) $request->user()->getAuthIdentifier(),
            'warning_letter.previewed',
            'warning_letter',
            (string) $warningLetter->getKey(),
        );

        return Inertia::render('warning-letters/show', [
            'letter' => [
                'id' => $warningLetter->id,
                'status' => $warningLetter->status,
                'data' => $warningLetter->preview_data,
            ],
        ]);
    }
}

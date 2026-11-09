<?php

namespace App\Http\Controllers;

use App\Enums\CaseStatus;
use App\Http\Requests\UpdateFraudAlertStatusRequest;
use App\Models\AnomalyFollowUp;
use App\Models\FraudAlert;
use App\Models\FraudAlertWorkflow;
use App\Services\AuditLogService;
use App\Services\FraudAlertPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FraudAlertStatusController extends Controller
{
    public function update(
        UpdateFraudAlertStatusRequest $request,
        FraudAlert $fraudAlert,
        FraudAlertPresenter $presenter,
        AuditLogService $auditLog,
    ): RedirectResponse {
        $status = CaseStatus::from($request->validated('status'));
        $userId = (int) $request->user()->getAuthIdentifier();

        DB::transaction(function () use ($fraudAlert, $status, $request, $presenter, $auditLog, $userId): void {
            $workflow = FraudAlertWorkflow::query()
                ->where('fraud_alert_id', $fraudAlert->id)
                ->lockForUpdate()
                ->first();
            $previousStatus = $workflow?->status ?? $presenter->statusFor($fraudAlert)->value;
            $workflow ??= new FraudAlertWorkflow([
                'fraud_alert_id' => $fraudAlert->id,
            ]);
            $workflow->status = $status->value;
            $workflow->save();

            AnomalyFollowUp::query()->create([
                'fraud_alert_id' => $fraudAlert->id,
                'user_id' => $userId,
                'action_type' => 'status_changed',
                'title' => 'Status diubah ke '.$status->label(),
                'notes' => $request->validated('notes'),
                'previous_status' => $previousStatus,
                'new_status' => $status->value,
            ]);

            $auditLog->record(
                $userId,
                'case.status_updated',
                'fraud_alert',
                (string) $fraudAlert->getKey(),
                ['status' => $status->value],
            );
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status dan catatan kasus tersimpan.']);

        return back();
    }
}

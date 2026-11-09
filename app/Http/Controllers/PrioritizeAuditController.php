<?php

namespace App\Http\Controllers;

use App\Enums\CaseStatus;
use App\Models\AnomalyFollowUp;
use App\Models\FraudAlert;
use App\Models\FraudAlertWorkflow;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PrioritizeAuditController extends Controller
{
    public function store(FraudAlert $fraudAlert, AuditLogService $auditLog): RedirectResponse
    {
        $userId = (int) request()->user()->getAuthIdentifier();

        DB::transaction(function () use ($fraudAlert, $auditLog, $userId): void {
            $workflow = FraudAlertWorkflow::query()
                ->where('fraud_alert_id', $fraudAlert->id)
                ->lockForUpdate()
                ->first();

            if ($workflow?->audit_prioritized) {
                return;
            }

            $previousStatus = $workflow?->status ?? CaseStatus::WaitingReview->value;
            $workflow ??= new FraudAlertWorkflow([
                'fraud_alert_id' => $fraudAlert->id,
            ]);
            $workflow->fill([
                'status' => CaseStatus::FieldAuditPriority->value,
                'audit_prioritized' => true,
                'prioritized_by' => $userId,
                'prioritized_at' => now(),
            ]);
            $workflow->save();

            AnomalyFollowUp::query()->create([
                'fraud_alert_id' => $fraudAlert->id,
                'user_id' => $userId,
                'action_type' => 'audit_prioritized',
                'title' => 'Kasus diprioritaskan untuk audit lapangan',
                'previous_status' => $previousStatus,
                'new_status' => CaseStatus::FieldAuditPriority->value,
            ]);

            $auditLog->record(
                $userId,
                'case.audit_prioritized',
                'fraud_alert',
                (string) $fraudAlert->getKey(),
            );
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kasus masuk prioritas audit lapangan.']);

        return back();
    }
}

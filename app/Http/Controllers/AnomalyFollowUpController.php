<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnomalyFollowUpRequest;
use App\Models\AnomalyFollowUp;
use App\Models\FraudAlert;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class AnomalyFollowUpController extends Controller
{
    public function store(
        StoreAnomalyFollowUpRequest $request,
        FraudAlert $fraudAlert,
        AuditLogService $auditLog,
    ): RedirectResponse {
        $userId = (int) $request->user()->getAuthIdentifier();
        $notes = $request->validated('notes');

        AnomalyFollowUp::query()->create([
            'fraud_alert_id' => $fraudAlert->id,
            'user_id' => $userId,
            'action_type' => 'inspection_note',
            'title' => 'Catatan pemeriksaan ditambahkan',
            'notes' => $notes,
        ]);
        $auditLog->record(
            $userId,
            'case.follow_up_added',
            'fraud_alert',
            (string) $fraudAlert->getKey(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Catatan tindak lanjut tersimpan.']);

        return back();
    }
}

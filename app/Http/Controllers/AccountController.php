<?php

namespace App\Http\Controllers;

use App\Enums\CaseStatus;
use App\Models\AnomalyFollowUp;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\DataMaskingService;
use App\Services\FraudAlertPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function show(
        Request $request,
        FraudAlertPresenter $presenter,
        DataMaskingService $masking,
        AuditLogService $auditLog,
    ): Response {
        $user = $request->user();
        abort_unless($user instanceof User, 403);
        $user->load('staffProfile');

        $activities = AnomalyFollowUp::query()
            ->with(['fraudAlert.company', 'fraudAlert.workflow'])
            ->where('user_id', $user->getKey())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(4)
            ->get();

        $auditLog->record(
            (int) $user->getAuthIdentifier(),
            'account.viewed',
            'user',
        );

        return Inertia::render('account/show', [
            'account' => [
                'name' => $user->name,
                'email' => $user->email,
                'status' => 'Aktif',
                'nip' => $masking->identifier($user->staffProfile?->nip),
                'position' => $user->staffProfile?->position,
                'employmentStatus' => $user->staffProfile?->employment_status,
                'organizationUnit' => $user->staffProfile?->organization_unit,
                'phone' => $masking->identifier($user->staffProfile?->phone),
                'assignedCity' => $user->staffProfile?->assigned_city,
                'assignedOffice' => $user->staffProfile?->assigned_office,
            ],
            'activities' => $activities->map(function (AnomalyFollowUp $activity) use ($presenter, $masking): array {
                $alert = $activity->fraudAlert;
                $case = $alert === null ? null : $presenter->present($alert);
                $status = $alert === null ? CaseStatus::WaitingReview : $presenter->statusFor($alert);

                return [
                    'id' => $activity->id,
                    'date' => $activity->created_at?->toDateTimeString(),
                    'company' => $case['company']['name'] ?? 'Perusahaan',
                    'type' => $case['typeLabel'] ?? 'Aktivitas pengawasan',
                    'notes' => $masking->text((string) $activity->notes),
                    'status' => $status->label(),
                ];
            })->values(),
            'activityCount' => $activities->count(),
        ]);
    }
}

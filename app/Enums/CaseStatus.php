<?php

namespace App\Enums;

enum CaseStatus: string
{
    case WaitingReview = 'waiting_review';
    case InReview = 'in_review';
    case FieldAuditPriority = 'field_audit_priority';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::WaitingReview => 'Menunggu tinjauan',
            self::InReview => 'Dalam peninjauan',
            self::FieldAuditPriority => 'Prioritas audit lapangan',
            self::Completed => 'Selesai',
        };
    }
}

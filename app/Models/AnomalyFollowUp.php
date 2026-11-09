<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnomalyFollowUp extends Model
{
    protected $fillable = [
        'fraud_alert_id',
        'user_id',
        'action_type',
        'title',
        'notes',
        'previous_status',
        'new_status',
    ];

    public function fraudAlert(): BelongsTo
    {
        return $this->belongsTo(FraudAlert::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

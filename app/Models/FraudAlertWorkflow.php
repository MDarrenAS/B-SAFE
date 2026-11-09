<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraudAlertWorkflow extends Model
{
    protected $fillable = [
        'fraud_alert_id',
        'status',
        'audit_prioritized',
        'prioritized_by',
        'prioritized_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'audit_prioritized' => 'boolean',
            'prioritized_at' => 'datetime',
        ];
    }

    public function fraudAlert(): BelongsTo
    {
        return $this->belongsTo(FraudAlert::class);
    }

    public function prioritizingUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prioritized_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarningLetter extends Model
{
    protected $fillable = [
        'fraud_alert_id',
        'user_id',
        'status',
        'preview_data',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['preview_data' => 'array'];
    }

    public function fraudAlert(): BelongsTo
    {
        return $this->belongsTo(FraudAlert::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

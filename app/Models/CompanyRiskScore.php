<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyRiskScore extends Model
{
    protected $fillable = [
        'company_npwp',
        'tahun',
        'masa',
        'score',
        'level',
        'breakdown',
        'generated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tahun' => 'integer',
            'masa' => 'integer',
            'score' => 'decimal:4',
            'breakdown' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_npwp', 'npwp');
    }
}

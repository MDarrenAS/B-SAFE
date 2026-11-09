<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FraudAlert extends Model
{
    protected $table = 'fraud_alert';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'npwp',
        'kode_badan_usaha',
        'nik',
        'jenis_anomali',
        'masa_pajak',
        'tahun_pajak',
        'nilai_bpjs',
        'nilai_pembanding',
        'selisih',
        'tingkat_risiko',
        'status_tindak_lanjut',
        'keterangan',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'masa_pajak' => 'integer',
            'tahun_pajak' => 'integer',
            'nilai_bpjs' => 'decimal:2',
            'nilai_pembanding' => 'decimal:2',
            'selisih' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'npwp', 'npwp');
    }

    public function workflow(): HasOne
    {
        return $this->hasOne(FraudAlertWorkflow::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(AnomalyFollowUp::class);
    }

    public function warningLetters(): HasMany
    {
        return $this->hasMany(WarningLetter::class);
    }
}

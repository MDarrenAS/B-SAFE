<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Company extends Model
{
    protected $table = 'kemnaker_perusahaan';

    protected $primaryKey = 'nib';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    public function fraudAlerts(): HasMany
    {
        return $this->hasMany(FraudAlert::class, 'npwp', 'npwp');
    }

    public function riskScores(): HasMany
    {
        return $this->hasMany(CompanyRiskScore::class, 'company_npwp', 'npwp');
    }

    public function bpjsBusiness(): HasOne
    {
        return $this->hasOne(BpjsBusiness::class, 'npwp', 'npwp');
    }

    public function wlkpReports(): HasMany
    {
        return $this->hasMany(WlkpReport::class, 'nib', 'nib');
    }

    public function workers(): HasMany
    {
        return $this->hasMany(KemnakerWorker::class, 'nib', 'nib');
    }
}

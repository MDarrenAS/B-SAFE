<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KemnakerWorker extends Model
{
    protected $table = 'kemnaker_tenaga_kerja';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_mulai_kerja' => 'date',
            'tanggal_akhir_kontrak' => 'date',
            'tanggal_berhenti' => 'date',
            'upah_pokok' => 'decimal:2',
            'tunjangan_tetap' => 'decimal:2',
        ];
    }
}

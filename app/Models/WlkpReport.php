<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WlkpReport extends Model
{
    protected $table = 'kemnaker_wlkp';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tahun_lapor' => 'integer',
            'per_tanggal' => 'date',
            'tanggal_lapor' => 'date',
            'jumlah_tk_total' => 'integer',
            'jumlah_pkwtt' => 'integer',
            'jumlah_pkwt' => 'integer',
        ];
    }
}

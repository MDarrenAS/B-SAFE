<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DukcapilPerson extends Model
{
    protected $table = 'dukcapil_penduduk';

    protected $primaryKey = 'nik';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date',
            'tanggal_meninggal' => 'date',
            'tanggal_rekam_ektp' => 'date',
        ];
    }
}

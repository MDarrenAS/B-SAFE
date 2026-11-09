<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BpjsMutation extends Model
{
    protected $table = 'bpjs_mutasi_peserta';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_mutasi' => 'date',
            'tanggal_lapor' => 'date',
        ];
    }
}

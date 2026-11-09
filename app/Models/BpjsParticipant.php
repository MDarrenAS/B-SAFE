<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BpjsParticipant extends Model
{
    protected $table = 'bpjs_peserta';

    protected $primaryKey = 'no_kartu';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'upah_dilaporkan' => 'decimal:2',
            'tanggal_efektif' => 'date',
            'tanggal_nonaktif' => 'date',
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxWithholding extends Model
{
    protected $table = 'djp_bukti_potong_pph21';

    protected $primaryKey = 'no_bukti_potong';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'masa_pajak' => 'integer',
            'tahun_pajak' => 'integer',
            'penghasilan_bruto' => 'decimal:2',
            'pph21_dipotong' => 'decimal:2',
            'tanggal_pemotongan' => 'date',
        ];
    }
}

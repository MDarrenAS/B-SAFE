<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DjpTaxObject extends Model
{
    protected $table = 'djp_ref_objek_pajak_pph21';

    protected $primaryKey = 'kode_objek_pajak';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;
}

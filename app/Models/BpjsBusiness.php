<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BpjsBusiness extends Model
{
    protected $table = 'bpjs_badan_usaha';

    protected $primaryKey = 'kode_badan_usaha';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;
}

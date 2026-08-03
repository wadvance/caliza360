<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoadProformaLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'load_proforma_id',
        'latitude',
        'longitude',
        'speed',
        'accuracy',
        'recorded_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'speed' => 'float',
        'accuracy' => 'float',
        'recorded_at' => 'datetime',
    ];

    public function proforma()
    {
        return $this->belongsTo(LoadProforma::class, 'load_proforma_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Control extends Model
{
    use HasFactory;

    protected $fillable = [
        'control_number',
        'date',
        'location',
        'control_type',
        'truck_id',
        'driver_id',
        'proforma_id',
        'dispatch_id',
        'weight_tons',
        'sack_count',
        'responsible_person',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'datetime',
        'weight_tons' => 'float',
        'sack_count' => 'integer',
    ];

    const LOCATION_CANTERA = 'cantera';
    const LOCATION_PLANTA = 'planta';

    const LOCATIONS = [
        self::LOCATION_CANTERA,
        self::LOCATION_PLANTA,
    ];

    const TYPE_ENTRADA = 'entrada';
    const TYPE_SALIDA = 'salida';

    const TYPES = [
        self::TYPE_ENTRADA,
        self::TYPE_SALIDA,
    ];

    public function truck()
    {
        return $this->belongsTo(Truck::class, 'truck_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function proforma()
    {
        return $this->belongsTo(LoadProforma::class, 'proforma_id');
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class, 'dispatch_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'truck_id',
        'type',
        'description',
        'service_date',
        'mileage_at_service',
        'cost',
        'status',
        'next_maintenance_date',
        'next_mileage',
        'notes',
    ];

    protected $casts = [
        'service_date' => 'date',
        'mileage_at_service' => 'float',
        'cost' => 'float',
        'next_maintenance_date' => 'date',
        'next_mileage' => 'float',
    ];

    public function truck()
    {
        return $this->belongsTo(Truck::class, 'truck_id');
    }
}

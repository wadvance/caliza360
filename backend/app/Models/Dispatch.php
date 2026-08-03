<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dispatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'dispatch_number',
        'date',
        'truck_id',
        'driver_id',
        'client_id',
        'destination_name',
        'material_type',
        'planned_tons',
        'actual_tons',
        'sack_count',
        'departure_datetime',
        'delivery_datetime',
        'status',
        'responsible_person',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'planned_tons' => 'float',
        'actual_tons' => 'float',
        'sack_count' => 'integer',
        'departure_datetime' => 'datetime',
        'delivery_datetime' => 'datetime',
    ];

    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';

    const STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_IN_TRANSIT,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    /**
     * Rendimiento: porcentaje de cumplimiento entre lo real y lo planificado.
     */
    public function getPerformancePercent()
    {
        return $this->planned_tons > 0
            ? round(($this->actual_tons / $this->planned_tons) * 100, 1)
            : 0;
    }

    public function truck()
    {
        return $this->belongsTo(Truck::class, 'truck_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

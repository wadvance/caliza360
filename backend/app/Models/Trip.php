<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'driver_id',
        'truck_id',
        'client_id',
        'origin_name',
        'origin_address',
        'origin_lat',
        'origin_lng',
        'origin_quarry',
        'destination_name',
        'destination_address',
        'destination_lat',
        'destination_lng',
        'destination_client',
        'material_type',
        'weight',
        'gross_weight',
        'tare_weight',
        'net_weight',
        'weighed_at',
        'batch_code',
        'quality_status',
        'quality_notes',
        'quality_inspector',
        'quality_checked_at',
        'price_per_ton',
        'total_amount',
        'scheduled_date',
        'scheduled_time',
        'departure_time',
        'arrival_time',
        'return_time',
        'status',
        'start_mileage',
        'end_mileage',
        'distance',
        'fuel_start',
        'fuel_end',
        'fuel_consumed',
        'photos',
        'customer_signature',
        'delivery_proof',
        'notes',
        'fuel_cost',
        'tolls_cost',
        'maintenance_cost',
        'other_cost',
        'ai_optimized_route',
        'estimated_duration',
        'actual_duration',
    ];

    protected $casts = [
        'origin_lat' => 'float',
        'origin_lng' => 'float',
        'destination_lat' => 'float',
        'destination_lng' => 'float',
        'weight' => 'float',
        'gross_weight' => 'float',
        'tare_weight' => 'float',
        'net_weight' => 'float',
        'weighed_at' => 'datetime',
        'quality_checked_at' => 'datetime',
        'price_per_ton' => 'float',
        'total_amount' => 'float',
        'scheduled_date' => 'date',
        'departure_time' => 'datetime',
        'arrival_time' => 'datetime',
        'return_time' => 'datetime',
        'start_mileage' => 'float',
        'end_mileage' => 'float',
        'distance' => 'float',
        'fuel_start' => 'float',
        'fuel_end' => 'float',
        'fuel_consumed' => 'float',
        'photos' => 'array',
        'fuel_cost' => 'float',
        'tolls_cost' => 'float',
        'maintenance_cost' => 'float',
        'other_cost' => 'float',
        'estimated_duration' => 'float',
        'actual_duration' => 'float',
    ];

    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_RETURNED = 'returned';
    const STATUS_CANCELLED = 'cancelled';

    const STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_IN_TRANSIT,
        self::STATUS_DELIVERED,
        self::STATUS_RETURNED,
        self::STATUS_CANCELLED,
    ];

    const QUALITY_PENDING = 'pending';
    const QUALITY_APPROVED = 'approved';
    const QUALITY_REJECTED = 'rejected';

    public function getNetWeight()
    {
        return !is_null($this->net_weight)
            ? $this->net_weight
            : ($this->gross_weight !== null && $this->tare_weight !== null
                ? $this->gross_weight - $this->tare_weight
                : null);
    }

    public function isScheduled()
    {
        return $this->status === self::STATUS_SCHEDULED;
    }

    public function isInTransit()
    {
        return $this->status === self::STATUS_IN_TRANSIT;
    }

    public function isDelivered()
    {
        return $this->status === self::STATUS_DELIVERED;
    }

    public function isReturned()
    {
        return $this->status === self::STATUS_RETURNED;
    }

    public function isCancelled()
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function getTotalCosts()
    {
        return $this->fuel_cost + $this->tolls_cost + $this->maintenance_cost + $this->other_cost;
    }

    public function getProfitability()
    {
        return $this->total_amount - $this->getTotalCosts();
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function truck()
    {
        return $this->belongsTo(Truck::class, 'truck_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function locations()
    {
        return $this->hasMany(TripLocation::class, 'trip_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoadProforma extends Model
{
    use HasFactory;

    protected $fillable = [
        'proforma_number',
        'date',
        'truck_id',
        'driver_id',
        'client_id',
        'origin_quarry',
        'origin_name',
        'origin_address',
        'origin_lat',
        'origin_lng',
        'destination_name',
        'destination_lat',
        'destination_lng',
        'material_type',
        'weight_tons',
        'sack_count',
        'gross_weight',
        'tare_weight',
        'net_weight',
        'unit_price',
        'total_amount',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'weight_tons' => 'float',
        'sack_count' => 'integer',
        'gross_weight' => 'float',
        'tare_weight' => 'float',
        'net_weight' => 'float',
        'unit_price' => 'float',
        'total_amount' => 'float',
        'origin_lat' => 'float',
        'origin_lng' => 'float',
        'destination_lat' => 'float',
        'destination_lng' => 'float',
    ];

    const STATUS_CREATED = 'created';
    const STATUS_LOADED = 'loaded';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED = 'delivered';

    const STATUSES = [
        self::STATUS_CREATED,
        self::STATUS_LOADED,
        self::STATUS_IN_TRANSIT,
        self::STATUS_DELIVERED,
    ];

    public function getNetWeight()
    {
        return !is_null($this->net_weight)
            ? $this->net_weight
            : ($this->gross_weight !== null && $this->tare_weight !== null
                ? $this->gross_weight - $this->tare_weight
                : null);
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

    public function locations()
    {
        return $this->hasMany(LoadProformaLocation::class, 'load_proforma_id');
    }
}

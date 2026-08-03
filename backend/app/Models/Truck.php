<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Services\FirebaseService;

class Truck extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'plate',
        'brand',
        'model',
        'year',
        'color',
        'vin_number',
        'engine_type',
        'capacity',
        'current_mileage',
        'status',
        'insurance_provider',
        'insurance_policy_number',
        'insurance_start_date',
        'insurance_end_date',
        'insurance_cost',
        'circulation_card_number',
        'circulation_card_expiry',
        'photos',
    ];

    protected $casts = [
        'year' => 'integer',
        'capacity' => 'float',
        'current_mileage' => 'float',
        'insurance_cost' => 'float',
        'insurance_start_date' => 'date',
        'insurance_end_date' => 'date',
        'circulation_card_expiry' => 'date',
        'photos' => 'array',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_MAINTENANCE = 'maintenance';
    const STATUS_INACTIVE = 'inactive';

    const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_MAINTENANCE,
        self::STATUS_INACTIVE,
    ];

    public function isActive()
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isMaintenance()
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    public function isInactive()
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function needsInsuranceRenewal()
    {
        return $this->insurance_end_date && $this->insurance_end_date->diffInDays(now()) <= 30;
    }

    public function needsCirculationCardRenewal()
    {
        return $this->circulation_card_expiry && $this->circulation_card_expiry->diffInDays(now()) <= 30;
    }

    public function trips()
    {
        return $this->hasMany(Trip::class, 'truck_id');
    }

    public function maintenanceRecords()
    {
        return $this->hasMany(Maintenance::class, 'truck_id');
    }

    public function maintenanceHistory()
    {
        return $this->hasMany(Maintenance::class, 'truck_id');
    }

    public function tires()
    {
        return $this->hasMany(Tire::class, 'truck_id');
    }
}

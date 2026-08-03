<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'license_number',
        'license_type',
        'license_expiry_date',
        'license_issued_by',
        'curp',
        'rfc',
        'phone',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'address',
        'hire_date',
        'status',
        'current_truck_id',
        'total_trips',
        'total_hours_worked',
        'rating',
        'photo',
        'documents',
    ];

    protected $casts = [
        'license_expiry_date' => 'date',
        'hire_date' => 'date',
        'total_trips' => 'integer',
        'total_hours_worked' => 'float',
        'rating' => 'float',
        'documents' => 'array',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_ON_TRIP = 'on_trip';

    const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_ON_TRIP,
    ];

    public function isActive()
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isOnTrip()
    {
        return $this->status === self::STATUS_ON_TRIP;
    }

    public function isInactive()
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function needsLicenseRenewal()
    {
        return $this->license_expiry_date && $this->license_expiry_date->diffInDays(now()) <= 30;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function currentTruck()
    {
        return $this->belongsTo(Truck::class, 'current_truck_id');
    }

    public function trips()
    {
        return $this->hasMany(Trip::class, 'driver_id');
    }

    public function workHours()
    {
        return $this->hasMany(WorkHours::class, 'driver_id');
    }
}

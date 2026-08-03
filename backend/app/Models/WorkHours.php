<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkHours extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'driver_id',
        'date',
        'start_time',
        'end_time',
        'total_hours',
        'trip_id',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'total_hours' => 'float',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';

    const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_COMPLETED,
    ];

    public function isActive()
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isCompleted()
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function calculateHours()
    {
        if ($this->start_time && $this->end_time) {
            $this->total_hours = $this->start_time->diffInHours($this->end_time);
            $this->status = self::STATUS_COMPLETED;
            $this->save();
            
            // Update driver total hours
            $driver = Driver::find($this->driver_id);
            if ($driver) {
                $driver->total_hours_worked = $driver->workHours()->sum('total_hours');
                $driver->save();
            }
        }
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function trip()
    {
        return $this->belongsTo(Trip::class, 'trip_id');
    }
}

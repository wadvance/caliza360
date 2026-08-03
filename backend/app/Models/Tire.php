<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tire extends Model
{
    use HasFactory;

    protected $fillable = [
        'truck_id',
        'position',
        'brand',
        'model',
        'serial_number',
        'install_date',
        'current_mileage',
        'max_mileage',
        'pressure',
        'status',
    ];

    protected $casts = [
        'install_date' => 'date',
        'current_mileage' => 'float',
        'max_mileage' => 'float',
        'pressure' => 'float',
    ];

    const STATUS_GOOD = 'good';
    const STATUS_WORN = 'worn';
    const STATUS_NEEDS_REPLACEMENT = 'needs_replacement';

    public function truck()
    {
        return $this->belongsTo(Truck::class, 'truck_id');
    }

    public function getLifespanRemaining()
    {
        if ($this->max_mileage <= 0) {
            return null;
        }
        return max(0, $this->max_mileage - $this->current_mileage);
    }
}
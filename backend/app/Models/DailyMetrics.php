<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyMetrics extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'date',
        'total_trips',
        'total_tons_transported',
        'total_income',
        'total_expenses',
        'profit',
        'fuel_consumed',
        'active_trucks',
        'active_drivers',
    ];

    protected $casts = [
        'date' => 'date',
        'total_trips' => 'integer',
        'total_tons_transported' => 'float',
        'total_income' => 'float',
        'total_expenses' => 'float',
        'profit' => 'float',
        'fuel_consumed' => 'float',
        'active_trucks' => 'integer',
        'active_drivers' => 'integer',
    ];

    public function calculateProfit()
    {
        $this->profit = $this->total_income - $this->total_expenses;
        $this->save();
    }

    public static function getOrCreateForDate($date)
    {
        $metrics = static::where('date', $date)->first();
        if (!$metrics) {
            $metrics = static::create([
                'date' => $date,
                'total_trips' => 0,
                'total_tons_transported' => 0,
                'total_income' => 0,
                'total_expenses' => 0,
                'profit' => 0,
                'fuel_consumed' => 0,
                'active_trucks' => 0,
                'active_drivers' => 0,
            ]);
        }
        return $metrics;
    }

    public static function updateFromTrips($date)
    {
        $trips = Trip::whereDate('scheduled_date', $date)->get();
        
        $metrics = static::getOrCreateForDate($date);
        
        $metrics->update([
            'total_trips' => $trips->count(),
            'total_tons_transported' => $trips->sum('weight'),
            'total_income' => $trips->sum('total_amount'),
            'total_expenses' => $trips->sum(function ($trip) {
                return $trip->fuel_cost + $trip->tolls_cost + $trip->maintenance_cost + $trip->other_cost;
            }),
            'fuel_consumed' => $trips->sum('fuel_consumed'),
        ]);
        
        $metrics->calculateProfit();
        
        return $metrics;
    }
}

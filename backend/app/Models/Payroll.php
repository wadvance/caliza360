<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'period',
        'start_date',
        'end_date',
        'base_salary',
        'overtime_hours',
        'overtime_rate',
        'overtime_pay',
        'bonuses',
        'deductions',
        'taxes',
        'net_pay',
        'trips_completed',
        'total_hours_worked',
        'status',
        'payment_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'payment_date' => 'date',
        'base_salary' => 'float',
        'overtime_hours' => 'float',
        'overtime_rate' => 'float',
        'overtime_pay' => 'float',
        'bonuses' => 'float',
        'deductions' => 'float',
        'taxes' => 'float',
        'net_pay' => 'float',
        'trips_completed' => 'integer',
        'total_hours_worked' => 'float',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_APPROVED = 'approved';
    const STATUS_PAID = 'paid';

    const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_APPROVED,
        self::STATUS_PAID,
    ];

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }
}

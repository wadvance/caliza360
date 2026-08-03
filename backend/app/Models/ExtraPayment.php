<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExtraPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'payroll_id',
        'concept',
        'description',
        'amount',
        'payment_date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'float',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PAID,
    ];

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function payroll()
    {
        return $this->belongsTo(Payroll::class, 'payroll_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

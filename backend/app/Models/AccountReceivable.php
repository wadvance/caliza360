<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountReceivable extends Model
{
    use HasFactory;

    protected $table = 'account_receivable';

    protected $fillable = [
        'client_id',
        'invoice_id',
        'amount',
        'paid_amount',
        'balance',
        'due_date',
        'status',
        'reminders',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_amount' => 'float',
        'balance' => 'float',
        'due_date' => 'date',
        'reminders' => 'array',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PARTIAL = 'partial';
    const STATUS_PAID = 'paid';
    const STATUS_OVERDUE = 'overdue';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PARTIAL,
        self::STATUS_PAID,
        self::STATUS_OVERDUE,
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }
}

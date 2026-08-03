<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'invoice_number',
        'type',
        'client_id',
        'supplier_id',
        'items',
        'subtotal',
        'iva',
        'total',
        'issue_date',
        'due_date',
        'payment_date',
        'status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'float',
        'iva' => 'float',
        'total' => 'float',
        'issue_date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date',
    ];

    const TYPE_SALE = 'sale';
    const TYPE_PURCHASE = 'purchase';

    const TYPES = [
        self::TYPE_SALE,
        self::TYPE_PURCHASE,
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_SENT = 'sent';
    const STATUS_PAID = 'paid';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_CANCELLED = 'cancelled';

    const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SENT,
        self::STATUS_PAID,
        self::STATUS_OVERDUE,
        self::STATUS_CANCELLED,
    ];

    public function isSale()
    {
        return $this->type === self::TYPE_SALE;
    }

    public function isPurchase()
    {
        return $this->type === self::TYPE_PURCHASE;
    }

    public function isPaid()
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isOverdue()
    {
        return $this->status === self::STATUS_OVERDUE || 
               ($this->status !== self::STATUS_PAID && $this->due_date && $this->due_date->isPast());
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}

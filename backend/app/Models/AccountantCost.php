<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountantCost extends Model
{
    use HasFactory;

    protected $table = 'accountant_costs';

    protected $fillable = [
        'category',
        'description',
        'amount',
        'tonnage',
        'unit_cost',
        'cost_date',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'cost_date' => 'date',
        'amount' => 'decimal:2',
        'tonnage' => 'decimal:2',
        'unit_cost' => 'decimal:2',
    ];

    const STATUS_REGISTRADO = 'registrado';
    const STATUS_VERIFICADO = 'verificado';
    const STATUS_ANULADO = 'anulado';

    const STATUSES = [
        self::STATUS_REGISTRADO,
        self::STATUS_VERIFICADO,
        self::STATUS_ANULADO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

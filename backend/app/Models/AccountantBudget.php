<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountantBudget extends Model
{
    use HasFactory;

    protected $table = 'accountant_budgets';

    protected $fillable = [
        'title',
        'budget_type',
        'category',
        'planned_amount',
        'actual_amount',
        'period',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'planned_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
    ];

    const TYPE_CAPEX = 'capex';
    const TYPE_OPEX = 'opex';

    const STATUS_BORRADOR = 'borrador';
    const STATUS_APROBADO = 'aprobado';
    const STATUS_EJECUTADO = 'ejecutado';
    const STATUS_CERRADO = 'cerrado';

    const STATUSES = [
        self::STATUS_BORRADOR,
        self::STATUS_APROBADO,
        self::STATUS_EJECUTADO,
        self::STATUS_CERRADO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

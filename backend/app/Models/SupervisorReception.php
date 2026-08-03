<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisorReception extends Model
{
    use HasFactory;

    protected $table = 'supervisor_reception';

    protected $fillable = [
        'stage',
        'material',
        'tonnage',
        'processed_date',
        'origin',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'processed_date' => 'date',
        'tonnage' => 'decimal:2',
    ];

    const STATUS_RECIBIDO = 'recibido';
    const STATUS_EN_PROCESO = 'en_proceso';
    const STATUS_COMPLETADO = 'completado';
    const STATUS_CANCELADO = 'cancelado';

    const STATUSES = [
        self::STATUS_RECIBIDO,
        self::STATUS_EN_PROCESO,
        self::STATUS_COMPLETADO,
        self::STATUS_CANCELADO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

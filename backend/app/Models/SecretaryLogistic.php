<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecretaryLogistic extends Model
{
    use HasFactory;

    protected $table = 'secretary_logistics';

    protected $fillable = [
        'type',
        'title',
        'details',
        'date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    const TYPE_SALA = 'sala';
    const TYPE_SUMINISTRO = 'suministro';
    const TYPE_VIAJE = 'viaje';
    const TYPE_RESERVA = 'reserva';

    const STATUS_PENDIENTE = 'pendiente';
    const STATUS_EN_PROCESO = 'en_proceso';
    const STATUS_COMPLETADO = 'completado';
    const STATUS_CANCELADO = 'cancelado';

    const STATUSES = [
        self::STATUS_PENDIENTE,
        self::STATUS_EN_PROCESO,
        self::STATUS_COMPLETADO,
        self::STATUS_CANCELADO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

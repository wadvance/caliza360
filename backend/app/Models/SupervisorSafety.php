<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisorSafety extends Model
{
    use HasFactory;

    protected $table = 'supervisor_safety';

    protected $fillable = [
        'type',
        'title',
        'description',
        'risk_level',
        'status',
        'checked_date',
        'action_plan',
        'created_by',
    ];

    protected $casts = [
        'checked_date' => 'date',
    ];

    const TYPE_PROTOCOLO_EPP = 'protocolo_epp';
    const TYPE_IPERC = 'iperc';
    const TYPE_VENTILACION = 'ventilacion';
    const TYPE_POLUCION = 'polucion';
    const TYPE_CONTROL_RIESGO = 'control_riesgo';

    const TYPES = [
        self::TYPE_PROTOCOLO_EPP,
        self::TYPE_IPERC,
        self::TYPE_VENTILACION,
        self::TYPE_POLUCION,
        self::TYPE_CONTROL_RIESGO,
    ];

    const STATUS_VERIFICADO = 'verificado';
    const STATUS_EN_ATENCION = 'en_atencion';
    const STATUS_PENDIENTE = 'pendiente';
    const STATUS_INCUMPLIDO = 'incumplido';

    const STATUSES = [
        self::STATUS_VERIFICADO,
        self::STATUS_EN_ATENCION,
        self::STATUS_PENDIENTE,
        self::STATUS_INCUMPLIDO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

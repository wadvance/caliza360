<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisorPlanning extends Model
{
    use HasFactory;

    protected $table = 'supervisor_planning';

    protected $fillable = [
        'title',
        'activity_type',
        'planned_date',
        'start_time',
        'end_time',
        'area',
        'assigned_person',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'planned_date' => 'date',
    ];

    const STATUS_PLANIFICADO = 'planificado';
    const STATUS_EN_PROCESO = 'en_proceso';
    const STATUS_COMPLETADO = 'completado';
    const STATUS_CANCELADO = 'cancelado';

    const STATUSES = [
        self::STATUS_PLANIFICADO,
        self::STATUS_EN_PROCESO,
        self::STATUS_COMPLETADO,
        self::STATUS_CANCELADO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

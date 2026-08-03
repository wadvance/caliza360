<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisorTask extends Model
{
    use HasFactory;

    protected $table = 'supervisor_tasks';

    protected $fillable = [
        'title',
        'assignee',
        'priority',
        'due_date',
        'notes',
        'status',
        'assigned_by',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    const PRIORITY_ALTA = 'alta';
    const PRIORITY_MEDIA = 'media';
    const PRIORITY_BAJA = 'baja';

    const STATUS_PENDIENTE = 'pendiente';
    const STATUS_EN_PROCESO = 'en_proceso';
    const STATUS_COMPLETADA = 'completada';
    const STATUS_CANCELADA = 'cancelada';

    const STATUSES = [
        self::STATUS_PENDIENTE,
        self::STATUS_EN_PROCESO,
        self::STATUS_COMPLETADA,
        self::STATUS_CANCELADA,
    ];

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}

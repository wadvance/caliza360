<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisorBlending extends Model
{
    use HasFactory;

    protected $table = 'supervisor_blending';

    protected $fillable = [
        'title',
        'materials',
        'target_spec',
        'blend_date',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'blend_date' => 'date',
        'target_spec' => 'decimal:2',
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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountantCompliance extends Model
{
    use HasFactory;

    protected $table = 'accountant_compliance';

    protected $fillable = [
        'type',
        'title',
        'amount',
        'due_date',
        'paid_date',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
        'amount' => 'decimal:2',
    ];

    const TYPE_IMPUESTO_EXTRACTIVO = 'impuesto_extractivo';
    const TYPE_IMPUESTO_GENERAL = 'impuesto_general';
    const TYPE_PROVISION_CIERRE = 'provision_cierre_mina';
    const TYPE_MITIGACION_AMBIENTAL = 'mitigacion_ambiental';
    const TYPE_TASA = 'tasa';
    const TYPE_OTRO = 'otro';

    const TYPES = [
        self::TYPE_IMPUESTO_EXTRACTIVO,
        self::TYPE_IMPUESTO_GENERAL,
        self::TYPE_PROVISION_CIERRE,
        self::TYPE_MITIGACION_AMBIENTAL,
        self::TYPE_TASA,
        self::TYPE_OTRO,
    ];

    const STATUS_PENDIENTE = 'pendiente';
    const STATUS_PROVISIONADO = 'provisionado';
    const STATUS_PAGADO = 'pagado';
    const STATUS_VENCIDO = 'vencido';

    const STATUSES = [
        self::STATUS_PENDIENTE,
        self::STATUS_PROVISIONADO,
        self::STATUS_PAGADO,
        self::STATUS_VENCIDO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

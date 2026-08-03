<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecretaryAgenda extends Model
{
    use HasFactory;

    protected $table = 'secretary_agenda';

    protected $fillable = [
        'title',
        'event_type',
        'mode',
        'starts_at',
        'ends_at',
        'participants',
        'location',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    const TYPE_CITA = 'cita';
    const TYPE_REUNION = 'reunion';

    const MODE_PRESENCIAL = 'presencial';
    const MODE_VIRTUAL = 'virtual';

    const STATUS_PENDIENTE = 'pendiente';
    const STATUS_CONFIRMADA = 'confirmada';
    const STATUS_REALIZADA = 'realizada';
    const STATUS_CANCELADA = 'cancelada';

    const STATUSES = [
        self::STATUS_PENDIENTE,
        self::STATUS_CONFIRMADA,
        self::STATUS_REALIZADA,
        self::STATUS_CANCELADA,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

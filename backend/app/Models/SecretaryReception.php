<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecretaryReception extends Model
{
    use HasFactory;

    protected $table = 'secretary_reception';

    protected $fillable = [
        'type',
        'person_name',
        'company',
        'phone',
        'subject',
        'notes',
        'status',
        'attended_at',
        'created_by',
    ];

    protected $casts = [
        'attended_at' => 'datetime',
    ];

    const TYPE_VISITA = 'visita';
    const TYPE_LLAMADA = 'llamada';
    const TYPE_CONSULTA = 'consulta';

    const STATUS_RECIBIDO = 'recibido';
    const STATUS_CANALIZADO = 'canalizado';
    const STATUS_ATENDIDO = 'atendido';

    const STATUSES = [
        self::STATUS_RECIBIDO,
        self::STATUS_CANALIZADO,
        self::STATUS_ATENDIDO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

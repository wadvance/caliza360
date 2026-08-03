<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupervisorQuality extends Model
{
    use HasFactory;

    protected $table = 'supervisor_quality';

    protected $fillable = [
        'material',
        'purity',
        'granulometry',
        'industry',
        'checked_date',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'checked_date' => 'date',
        'purity' => 'decimal:2',
    ];

    const STATUS_CUMPLE = 'cumple';
    const STATUS_NO_CUMPLE = 'no_cumple';
    const STATUS_PENDIENTE = 'pendiente';

    const STATUSES = [
        self::STATUS_CUMPLE,
        self::STATUS_NO_CUMPLE,
        self::STATUS_PENDIENTE,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

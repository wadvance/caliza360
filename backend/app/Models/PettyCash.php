<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PettyCash extends Model
{
    use HasFactory;

    protected $table = 'petty_cash';

    protected $fillable = [
        'date',
        'concept',
        'type',
        'amount',
        'category',
        'responsible_person',
        'reference',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'float',
    ];

    const TYPE_ENTRADA = 'entrada';
    const TYPE_SALIDA = 'salida';

    const TYPES = [
        self::TYPE_ENTRADA,
        self::TYPE_SALIDA,
    ];

    const CATEGORIES = [
        'viaticos',
        'combustible',
        'utiles_oficina',
        'mantenimiento',
        'compras_menores',
        'fondo_inicial',
        'otros',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

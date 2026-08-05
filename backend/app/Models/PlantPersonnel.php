<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlantPersonnel extends Model
{
    use HasFactory;

    protected $table = 'plant_personnel';

    protected $fillable = [
        'name',
        'position',
        'status',
        'created_by',
    ];

    const STATUS_ACTIVO = 'activo';
    const STATUS_INACTIVO = 'inactivo';

    const STATUSES = [
        self::STATUS_ACTIVO,
        self::STATUS_INACTIVO,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

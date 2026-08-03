<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountantAsset extends Model
{
    use HasFactory;

    protected $table = 'accountant_assets';

    protected $fillable = [
        'name',
        'type',
        'acquisition_value',
        'acquisition_date',
        'useful_life_years',
        'salvage_value',
        'accumulated_depreciation',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'acquisition_date' => 'date',
        'acquisition_value' => 'decimal:2',
        'useful_life_years' => 'decimal:2',
        'salvage_value' => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
    ];

    const STATUS_ACTIVO = 'activo';
    const STATUS_DEPRECIADO = 'depreciado';
    const STATUS_RETIRADO = 'retirado';

    const STATUSES = [
        self::STATUS_ACTIVO,
        self::STATUS_DEPRECIADO,
        self::STATUS_RETIRADO,
    ];

    /**
     * Depreciación anual lineal (sin considerar el valor de salvamento).
     */
    public function annualDepreciation(): float
    {
        $base = (float) $this->acquisition_value - (float) ($this->salvage_value ?? 0);
        $years = (float) $this->useful_life_years;

        if ($years <= 0) {
            return 0;
        }

        return max(0, $base / $years);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

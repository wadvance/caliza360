<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'id',
        'name',
        'material_type',
        'location',
        'current_stock',
        'unit',
        'min_stock',
        'max_stock',
        'unit_cost',
        'last_entry',
        'last_exit',
        'status',
    ];

    protected $casts = [
        'name' => 'string',
        'material_type' => 'string',
        'location' => 'string',
        'current_stock' => 'float',
        'min_stock' => 'float',
        'max_stock' => 'float',
        'unit_cost' => 'float',
        'last_entry' => 'date',
        'last_exit' => 'date',
    ];

    const STATUS_NORMAL = 'normal';
    const STATUS_LOW = 'low';
    const STATUS_CRITICAL = 'critical';

    const STATUSES = [
        self::STATUS_NORMAL,
        self::STATUS_LOW,
        self::STATUS_CRITICAL,
    ];

    public function isNormal()
    {
        return $this->status === self::STATUS_NORMAL;
    }

    public function isLow()
    {
        return $this->status === self::STATUS_LOW;
    }

    public function isCritical()
    {
        return $this->status === self::STATUS_CRITICAL;
    }

    public function needsRestock()
    {
        return $this->current_stock <= $this->min_stock;
    }

    public function isOverStock()
    {
        return $this->current_stock >= $this->max_stock;
    }

    public function updateStatus()
    {
        if ($this->current_stock <= $this->min_stock * 0.5) {
            $this->status = self::STATUS_CRITICAL;
        } elseif ($this->current_stock <= $this->min_stock) {
            $this->status = self::STATUS_LOW;
        } else {
            $this->status = self::STATUS_NORMAL;
        }
        $this->save();
    }

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class, 'inventory_id');
    }
}

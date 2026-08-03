<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'type',
        'severity',
        'title',
        'message',
        'entity_id',
        'entity_type',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    const TYPE_MAINTENANCE = 'maintenance';
    const TYPE_INSURANCE = 'insurance';
    const TYPE_LICENSE = 'license';
    const TYPE_INVENTORY = 'inventory';
    const TYPE_PAYMENT = 'payment';

    const TYPES = [
        self::TYPE_MAINTENANCE,
        self::TYPE_INSURANCE,
        self::TYPE_LICENSE,
        self::TYPE_INVENTORY,
        self::TYPE_PAYMENT,
    ];

    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';

    const SEVERITIES = [
        self::SEVERITY_LOW,
        self::SEVERITY_MEDIUM,
        self::SEVERITY_HIGH,
        self::SEVERITY_CRITICAL,
    ];

    public function isRead()
    {
        return $this->is_read === true;
    }

    public function markAsRead()
    {
        $this->is_read = true;
        $this->save();
    }

    public function isMaintenance()
    {
        return $this->type === self::TYPE_MAINTENANCE;
    }

    public function isInsurance()
    {
        return $this->type === self::TYPE_INSURANCE;
    }

    public function isLicense()
    {
        return $this->type === self::TYPE_LICENSE;
    }

    public function isInventory()
    {
        return $this->type === self::TYPE_INVENTORY;
    }

    public function isPayment()
    {
        return $this->type === self::TYPE_PAYMENT;
    }

    public function getSeverityColor()
    {
        return match($this->severity) {
            self::SEVERITY_LOW => 'gray',
            self::SEVERITY_MEDIUM => 'yellow',
            self::SEVERITY_HIGH => 'orange',
            self::SEVERITY_CRITICAL => 'red',
            default => 'gray',
        };
    }
}

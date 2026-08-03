<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'name',
        'company',
        'rfc',
        'email',
        'phone',
        'address',
        'material_type',
        'payment_terms',
        'total_purchases',
        'outstanding_balance',
        'rating',
        'notes',
    ];

    protected $casts = [
        'total_purchases' => 'float',
        'outstanding_balance' => 'float',
        'rating' => 'float',
    ];

    public function hasOutstandingBalance()
    {
        return $this->outstanding_balance > 0;
    }

    public function purchases()
    {
        return $this->hasMany(SupplierPurchase::class, 'supplier_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'supplier_id');
    }
}

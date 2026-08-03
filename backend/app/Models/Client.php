<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'name',
        'company',
        'rfc',
        'email',
        'phone',
        'address_street',
        'address_number',
        'address_colony',
        'address_city',
        'address_state',
        'address_zip_code',
        'contact_person',
        'payment_terms',
        'credit_limit',
        'current_balance',
        'total_purchases',
        'total_tons_purchased',
        'rating',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'float',
        'current_balance' => 'float',
        'total_purchases' => 'float',
        'total_tons_purchased' => 'float',
        'rating' => 'float',
    ];

    public function hasOutstandingBalance()
    {
        return $this->current_balance > 0;
    }

    public function isWithinCreditLimit($amount)
    {
        return $this->current_balance + $amount <= $this->credit_limit;
    }

    public function trips()
    {
        return $this->hasMany(Trip::class, 'client_id');
    }

    public function purchases()
    {
        return $this->hasMany(ClientPurchase::class, 'client_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }
}

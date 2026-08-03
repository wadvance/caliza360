<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecretaryDocument extends Model
{
    use HasFactory;

    protected $table = 'secretary_documents';

    protected $fillable = [
        'title',
        'category',
        'format',
        'location',
        'notes',
        'created_by',
    ];

    const FORMAT_FISICO = 'fisico';
    const FORMAT_DIGITAL = 'digital';

    const FORMATS = [
        self::FORMAT_FISICO,
        self::FORMAT_DIGITAL,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

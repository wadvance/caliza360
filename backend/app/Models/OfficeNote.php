<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficeNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'note_number',
        'title',
        'body',
        'note_type',
        'note_date',
        'status',
        'related_to',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'note_date' => 'date',
    ];

    const TYPE_GENERAL = 'general';
    const TYPE_MEMORANDO = 'memorando';
    const TYPE_MINUTA = 'minuta';
    const TYPE_OFICIO = 'oficio';
    const TYPE_COMUNICADO = 'comunicado';
    const TYPE_OTRO = 'otro';

    const TYPES = [
        self::TYPE_GENERAL,
        self::TYPE_MEMORANDO,
        self::TYPE_MINUTA,
        self::TYPE_OFICIO,
        self::TYPE_COMUNICADO,
        self::TYPE_OTRO,
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_FINAL = 'final';

    const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_FINAL,
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppConversation extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_conversations';

    protected $fillable = [
        'contact_name',
        'contact_phone',
        'status',
        'last_message_at',
        'unread_count',
        'assigned_to',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'unread_count' => 'integer',
    ];

    const STATUS_NEW = 'new';
    const STATUS_ACTIVE = 'active';
    const STATUS_CLOSED = 'closed';

    const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_ACTIVE,
        self::STATUS_CLOSED,
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsAppMessage::class, 'conversation_id')->orderBy('message_at')->orderBy('id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}

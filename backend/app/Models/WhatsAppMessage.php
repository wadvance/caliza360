<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppMessage extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_messages';

    protected $fillable = [
        'conversation_id',
        'direction',
        'content',
        'message_at',
        'sent_by',
        'wa_message_id',
        'delivery_status',
        'error',
    ];

    protected $casts = [
        'message_at' => 'datetime',
    ];

    const DELIVERY_PENDING = 'pending';
    const DELIVERY_SENT = 'sent';
    const DELIVERY_DELIVERED = 'delivered';
    const DELIVERY_READ = 'read';
    const DELIVERY_FAILED = 'failed';

    const DELIVERY_STATUSES = [
        self::DELIVERY_PENDING,
        self::DELIVERY_SENT,
        self::DELIVERY_DELIVERED,
        self::DELIVERY_READ,
        self::DELIVERY_FAILED,
    ];

    const DIR_INCOMING = 'incoming';
    const DIR_OUTGOING = 'outgoing';

    const DIRECTIONS = [
        self::DIR_INCOMING,
        self::DIR_OUTGOING,
    ];

    public function conversation()
    {
        return $this->belongsTo(WhatsAppConversation::class, 'conversation_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}

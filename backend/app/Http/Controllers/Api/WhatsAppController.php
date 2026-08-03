<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;
use App\Services\WhatsAppCloudService;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    /**
     * Centro de mensajería interno: conversaciones de WhatsApp.
     * Uso exclusivo de la secretaria (screen:whatsapp).
     */
    public function index(Request $request)
    {
        $query = WhatsAppConversation::withCount('messages')
            ->orderByRaw('COALESCE(last_message_at, created_at) DESC');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('contact_name', 'like', "%{$s}%")
                    ->orWhere('contact_phone', 'like', "%{$s}%");
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request, WhatsAppCloudService $whatsapp)
    {
        $data = $this->validateConversation($request);
        $data['contact_phone'] = $whatsapp->normalizePhone($data['contact_phone'] ?? null);

        $conversation = WhatsAppConversation::create([
            ...$data,
            'status' => $data['status'] ?? WhatsAppConversation::STATUS_ACTIVE,
        ]);

        return response()->json($conversation, 201);
    }

    public function show(WhatsAppConversation $conversation)
    {
        return response()->json([
            'conversation' => $conversation->load('assignee:id,name'),
            'messages' => $conversation->messages()->with('sender:id,name')->get(),
        ]);
    }

    public function update(Request $request, WhatsAppConversation $conversation, WhatsAppCloudService $whatsapp)
    {
        $data = $this->validateConversation($request);
        if (isset($data['contact_phone'])) {
            $data['contact_phone'] = $whatsapp->normalizePhone($data['contact_phone']);
        }

        $conversation->update($data);

        return response()->json($conversation);
    }

    public function destroy(WhatsAppConversation $conversation)
    {
        $conversation->delete();

        return response()->json(['message' => 'Conversación eliminada correctamente']);
    }

    /**
     * Enviar un mensaje saliente (respuesta de la secretaria).
     * Si la API Cloud de Meta está configurada, el mensaje se envía de verdad.
     */
    public function sendMessage(Request $request, WhatsAppConversation $conversation, WhatsAppCloudService $whatsapp)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $message = WhatsAppMessage::create([
            'conversation_id' => $conversation->id,
            'direction' => WhatsAppMessage::DIR_OUTGOING,
            'content' => $request->content,
            'message_at' => now(),
            'sent_by' => $request->user()->id,
            'delivery_status' => $whatsapp->isConfigured() ? WhatsAppMessage::DELIVERY_PENDING : WhatsAppMessage::DELIVERY_PENDING,
        ]);

        // Envío real a través de la API Cloud de Meta
        $result = $whatsapp->sendTextMessage($conversation->contact_phone, $request->content);

        if ($result['success']) {
            $message->wa_message_id = $result['wa_message_id'] ?? null;
            $message->delivery_status = WhatsAppMessage::DELIVERY_SENT;
            $message->error = null;
        } else {
            $message->delivery_status = WhatsAppMessage::DELIVERY_FAILED;
            $message->error = $result['error'] ?? 'Error desconocido';
        }

        $message->save();

        $conversation->last_message_at = now();
        $conversation->status = WhatsAppConversation::STATUS_ACTIVE;
        $conversation->save();

        return response()->json($message->load('sender:id,name'), 201);
    }

    /**
     * Registrar un mensaje entrante del contacto.
     */
    public function receiveMessage(Request $request, WhatsAppConversation $conversation)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $message = WhatsAppMessage::create([
            'conversation_id' => $conversation->id,
            'direction' => WhatsAppMessage::DIR_INCOMING,
            'content' => $request->content,
            'message_at' => now(),
        ]);

        $conversation->last_message_at = now();
        $conversation->status = WhatsAppConversation::STATUS_ACTIVE;
        $conversation->increment('unread_count');
        $conversation->save();

        return response()->json($message, 201);
    }

    /**
     * Marcar una conversación como leída.
     */
    public function markRead(WhatsAppConversation $conversation)
    {
        $conversation->unread_count = 0;
        $conversation->save();

        return response()->json(['message' => 'Conversación marcada como leída']);
    }

    /**
     * Resumen del centro de mensajería.
     */
    public function summary()
    {
        return response()->json([
            'total_conversations' => WhatsAppConversation::count(),
            'unread' => WhatsAppConversation::where('unread_count', '>', 0)->count(),
            'active' => WhatsAppConversation::where('status', WhatsAppConversation::STATUS_ACTIVE)->count(),
            'closed' => WhatsAppConversation::where('status', WhatsAppConversation::STATUS_CLOSED)->count(),
        ]);
    }

    /**
     * Estado de configuración del envío real.
     */
    public function status(WhatsAppCloudService $whatsapp)
    {
        return response()->json([
            'configured' => $whatsapp->isConfigured(),
            'business_phone' => config('whatsapp.business_phone'),
        ]);
    }

    /**
     * Verificación del webhook (mano de Meta con hub.challenge).
     * Endpoint público: GET /api/whatsapp/webhook
     */
    public function webhookVerify(Request $request, WhatsAppCloudService $whatsapp)
    {
        $challenge = $whatsapp->verifyWebhook(
            (string) $request->query('hub_mode'),
            (string) $request->query('hub_verify_token'),
            $request->query('hub_challenge')
        );

        if ($challenge !== null) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Verificación fallida'], 403);
    }

    /**
     * Recepción de notificaciones de Meta (mensajes entrantes y estados).
     * Endpoint público: POST /api/whatsapp/webhook
     */
    public function webhook(Request $request, WhatsAppCloudService $whatsapp)
    {
        $payload = $request->json()->all();

        $parsed = $whatsapp->parseWebhook($payload);

        if (! $parsed) {
            return response()->json(['status' => 'ignored'], 200);
        }

        if ($parsed['type'] === 'status') {
            $this->updateDeliveryStatus($parsed['message_id'], $parsed['delivery_status']);
            return response()->json(['status' => 'ok'], 200);
        }

        if ($parsed['type'] === 'message') {
            // Meta envía el teléfono en formato internacional sin "+"; se normaliza a E.164
            $parsed['phone'] = $whatsapp->normalizePhone($parsed['phone']);
            $this->storeIncomingMessage($parsed);
            return response()->json(['status' => 'ok'], 200);
        }

        return response()->json(['status' => 'ignored'], 200);
    }

    /**
     * Registrar un mensaje entrante recibido por el webhook.
     */
    protected function storeIncomingMessage(array $parsed): void
    {
        $phone = $parsed['phone'] ?? null;
        $content = $parsed['content'];

        if (empty($content) && empty($phone)) {
            return;
        }

        $conversation = WhatsAppConversation::where('contact_phone', $phone)->first();

        if (! $conversation) {
            $conversation = WhatsAppConversation::create([
                'contact_name' => $phone ?: 'Desconocido',
                'contact_phone' => $phone,
                'status' => WhatsAppConversation::STATUS_NEW,
            ]);
        }

        WhatsAppMessage::create([
            'conversation_id' => $conversation->id,
            'direction' => WhatsAppMessage::DIR_INCOMING,
            'content' => $content,
            'message_at' => isset($parsed['timestamp']) ? \Carbon\Carbon::createFromTimestamp($parsed['timestamp']) : now(),
            'wa_message_id' => $parsed['message_id'] ?? null,
            'delivery_status' => WhatsAppMessage::DELIVERY_DELIVERED,
        ]);

        $conversation->last_message_at = now();
        $conversation->status = WhatsAppConversation::STATUS_ACTIVE;
        $conversation->increment('unread_count');
        $conversation->save();
    }

    /**
     * Actualizar el estado de entrega de un mensaje saliente.
     */
    protected function updateDeliveryStatus(?string $waMessageId, ?string $status): void
    {
        if (! $waMessageId || ! $status) {
            return;
        }

        $mapped = match ($status) {
            'sent' => WhatsAppMessage::DELIVERY_SENT,
            'delivered' => WhatsAppMessage::DELIVERY_DELIVERED,
            'read' => WhatsAppMessage::DELIVERY_READ,
            'failed' => WhatsAppMessage::DELIVERY_FAILED,
            default => null,
        };

        if ($mapped) {
            WhatsAppMessage::where('wa_message_id', $waMessageId)
                ->update(['delivery_status' => $mapped]);
        }
    }

    protected function validateConversation(Request $request): array
    {
        return $request->validate([
            'contact_name' => 'required|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'status' => 'sometimes|in:' . implode(',', WhatsAppConversation::STATUSES),
            'assigned_to' => 'nullable|exists:users,id',
        ]);
    }
}

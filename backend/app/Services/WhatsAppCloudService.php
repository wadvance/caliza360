<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppCloudService
{
    public function isConfigured(): bool
    {
        return (bool) config('whatsapp.enabled')
            && ! empty(config('whatsapp.token'))
            && ! empty(config('whatsapp.phone_number_id'));
    }

    /**
     * Enviar un mensaje de texto real por la API Cloud de Meta.
     *
     * @return array{success: bool, wa_message_id?: string, error?: string}
     */
    public function sendTextMessage(string $to, string $message): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'WhatsApp Cloud API no está configurada. Agregue WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID en el .env.',
            ];
        }

        $phone = $this->normalizePhone($to);

        if (! $phone) {
            return ['success' => false, 'error' => 'Número de teléfono inválido.'];
        }

        $url = sprintf(
            'https://graph.facebook.com/%s/%s/messages',
            config('whatsapp.api_version'),
            config('whatsapp.phone_number_id')
        );

        try {
            $response = Http::timeout(config('whatsapp.timeout'))
                ->withToken(config('whatsapp.token'))
                ->asJson()
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'to' => $phone,
                    'type' => 'text',
                    'text' => ['body' => $message],
                ]);
        } catch (ConnectionException $e) {
            Log::error('WhatsApp Cloud API: error de conexión', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => 'No se pudo conectar con WhatsApp. Verifique la conexión a internet.'];
        }

        if ($response->successful()) {
            $data = $response->json();
            return [
                'success' => true,
                'wa_message_id' => $data['messages'][0]['id'] ?? null,
            ];
        }

        $errorDetail = $this->extractErrorMessage($response->json());
        Log::error('WhatsApp Cloud API: error al enviar', ['phone' => $phone, 'error' => $errorDetail]);

        return ['success' => false, 'error' => $errorDetail];
    }

    /**
     * Verificar el webhook (mano de Meta hacia el servidor).
     */
    public function verifyWebhook(string $mode, string $token, ?string $challenge): ?string
    {
        if ($mode === 'subscribe' && hash_equals(config('whatsapp.webhook_verify_token'), $token)) {
            return $challenge;
        }

        return null;
    }

    /**
     * Procesar una notificación entrante del webhook de Meta
     * (mensajes entrantes y actualizaciones de estado).
     *
     * @return array{type: string, message_id?: string, phone?: string, content?: string, timestamp?: string, delivery_status?: string}
     */
    public function parseWebhook(array $payload): ?array
    {
        $entry = $payload['entry'][0] ?? null;
        $changes = $entry['changes'][0] ?? null;
        $value = $changes['value'] ?? null;

        if (! $value) {
            return null;
        }

        // Actualización de estado (enviado/entregado/leído)
        if (isset($value['statuses'])) {
            $status = $value['statuses'][0] ?? null;
            if ($status) {
                return [
                    'type' => 'status',
                    'message_id' => $status['id'] ?? null,
                    'delivery_status' => $status['status'] ?? null,
                    'timestamp' => $status['timestamp'] ?? null,
                ];
            }
        }

        // Mensaje entrante
        if (isset($value['messages'])) {
            $msg = $value['messages'][0] ?? null;
            if ($msg) {
                $phone = $msg['from'] ?? null;

                $content = null;
                if (isset($msg['text']['body'])) {
                    $content = $msg['text']['body'];
                }

                return [
                    'type' => 'message',
                    'message_id' => $msg['id'] ?? null,
                    'phone' => $phone,
                    'content' => $content,
                    'timestamp' => $msg['timestamp'] ?? null,
                ];
            }
        }

        return null;
    }

    /**
     * Normalizar un número de teléfono al formato internacional E.164 (+507XXXXXXXX).
     */
    public function normalizePhone(?string $phone): ?string
    {
        if (empty($phone)) {
            return null;
        }

        $raw = trim($phone);
        $hasPlus = str_starts_with($raw, '+');
        $digits = preg_replace('/\D+/', '', $raw);

        if ($digits === '' || strlen($digits) > 15) {
            return null;
        }

        if ($hasPlus) {
            return '+' . $digits;
        }

        $cc = config('whatsapp.default_country_code');
        $d = ltrim($digits, '0');

        // Ya es internacional sin "+" (ej. 50769000000 enviado por Meta)
        if (str_starts_with($d, $cc) && strlen($d) - strlen($cc) >= 7) {
            return '+' . $d;
        }

        // Número local → agregar el código de país por defecto (507 Panamá)
        return '+' . $cc . $d;
    }

    protected function extractErrorMessage(?array $data): string
    {
        if (isset($data['error']['error']['message'])) {
            return $data['error']['error']['message'];
        }

        if (isset($data['error']['message'])) {
            return $data['error']['message'];
        }

        return 'Error desconocido de la API de WhatsApp.';
    }
}

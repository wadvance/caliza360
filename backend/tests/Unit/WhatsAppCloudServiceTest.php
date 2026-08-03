<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\WhatsAppCloudService;
use Illuminate\Support\Facades\Http;

class WhatsAppCloudServiceTest extends TestCase
{
    protected WhatsAppCloudService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new WhatsAppCloudService();
    }

    public function test_normalize_phone_local_number(): void
    {
        $this->assertEquals('+50760000001', $this->service->normalizePhone('6000-0001'));
        $this->assertEquals('+50760000001', $this->service->normalizePhone('60000001'));
    }

    public function test_normalize_phone_with_country_code(): void
    {
        $this->assertEquals('+50760000001', $this->service->normalizePhone('+507 6000-0001'));
        $this->assertEquals('+50760000001', $this->service->normalizePhone('+50760000001'));
    }

    public function test_normalize_phone_international_without_plus(): void
    {
        $this->assertEquals('+50760000001', $this->service->normalizePhone('50760000001'));
    }

    public function test_normalize_phone_invalid(): void
    {
        $this->assertNull($this->service->normalizePhone(''));
        $this->assertNull($this->service->normalizePhone(null));
        $this->assertNull($this->service->normalizePhone('abcdefghijklmnopqrstuvwxyz'));
    }

    public function test_not_configured_when_disabled(): void
    {
        config(['whatsapp.enabled' => false]);
        $this->assertFalse($this->service->isConfigured());
    }

    public function test_send_returns_error_when_not_configured(): void
    {
        config(['whatsapp.enabled' => false]);
        $result = $this->service->sendTextMessage('60000001', 'Hola');
        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_send_text_message_success(): void
    {
        config(['whatsapp.enabled' => true]);
        config(['whatsapp.token' => 'test-token']);
        config(['whatsapp.phone_number_id' => '123456789']);

        Http::fake([
            'graph.facebook.com/*' => Http::response([
                'messages' => [['id' => 'wamid.ABC123']],
            ], 200),
        ]);

        $result = $this->service->sendTextMessage('+50760000001', 'Hola');

        $this->assertTrue($result['success']);
        $this->assertEquals('wamid.ABC123', $result['wa_message_id']);
    }

    public function test_send_text_message_error(): void
    {
        config(['whatsapp.enabled' => true]);
        config(['whatsapp.token' => 'test-token']);
        config(['whatsapp.phone_number_id' => '123456789']);

        Http::fake([
            'graph.facebook.com/*' => Http::response([
                'error' => ['message' => 'Token inválido'],
            ], 400),
        ]);

        $result = $this->service->sendTextMessage('+50760000001', 'Hola');

        $this->assertFalse($result['success']);
        $this->assertEquals('Token inválido', $result['error']);
    }

    public function test_verify_webhook_returns_challenge(): void
    {
        config(['whatsapp.webhook_verify_token' => 'mi-token-secreto']);
        $challenge = $this->service->verifyWebhook('subscribe', 'mi-token-secreto', 'CHALLENGE_123');
        $this->assertEquals('CHALLENGE_123', $challenge);
    }

    public function test_verify_webhook_rejects_wrong_token(): void
    {
        config(['whatsapp.webhook_verify_token' => 'mi-token-secreto']);
        $challenge = $this->service->verifyWebhook('subscribe', 'malo', 'CHALLENGE_123');
        $this->assertNull($challenge);
    }

    public function test_parse_webhook_incoming_message(): void
    {
        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'WHATSAPP_BUSINESS_ACCOUNT_ID',
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'messages' => [[
                            'from' => '50760000001',
                            'id' => 'wamid.INCOMING',
                            'timestamp' => '1700000000',
                            'text' => ['body' => 'Hola, necesito caliza'],
                        ]],
                    ],
                ]],
            ]],
        ];

        $parsed = $this->service->parseWebhook($payload);

        $this->assertEquals('message', $parsed['type']);
        $this->assertEquals('50760000001', $parsed['phone']);
        $this->assertEquals('Hola, necesito caliza', $parsed['content']);
        $this->assertEquals('wamid.INCOMING', $parsed['message_id']);
    }

    public function test_parse_webhook_status_update(): void
    {
        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'WHATSAPP_BUSINESS_ACCOUNT_ID',
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'statuses' => [[
                            'id' => 'wamid.OUTGOING_1',
                            'status' => 'read',
                            'timestamp' => '1700000001',
                        ]],
                    ],
                ]],
            ]],
        ];

        $parsed = $this->service->parseWebhook($payload);

        $this->assertEquals('status', $parsed['type']);
        $this->assertEquals('wamid.OUTGOING_1', $parsed['message_id']);
        $this->assertEquals('read', $parsed['delivery_status']);
    }

    public function test_parse_webhook_empty_payload(): void
    {
        $this->assertNull($this->service->parseWebhook([]));
    }
}

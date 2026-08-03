<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class EmailSettingsController extends Controller
{
    /**
     * Get current email report settings
     */
    public function index(): JsonResponse
    {
        $settings = Config::get('email_reports', []);

        return response()->json([
            'data' => [
                'recipients' => $settings['recipients'] ?? [],
                'schedule' => $settings['schedule'] ?? [],
            ]
        ]);
    }

    /**
     * Update email report settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipients.daily' => 'nullable|array',
            'recipients.daily.*' => 'email',
            'recipients.weekly' => 'nullable|array',
            'recipients.weekly.*' => 'email',
            'recipients.alerts' => 'nullable|array',
            'recipients.alerts.*' => 'email',
        ]);

        $configPath = config_path('email_reports.php');
        $config = require $configPath;

        if (isset($validated['recipients'])) {
            $config['recipients'] = array_merge($config['recipients'], $validated['recipients']);
        }

        $newConfig = var_export($config, true);
        file_put_contents($configPath, "<?php\n\nreturn {$newConfig};\n");

        return response()->json(['message' => 'Configuración actualizada correctamente']);
    }

    /**
     * Test send a daily report
     */
    public function testDaily(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        try {
            $emailService = new EmailService();
            $emailService->sendDailySummary([$validated['email']]);
            return response()->json(['message' => 'Reporte de prueba enviado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al enviar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Test send inventory alerts
     */
    public function testAlerts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        try {
            $emailService = new EmailService();
            $sent = $emailService->sendInventoryAlerts([$validated['email']]);
            if ($sent) {
                return response()->json(['message' => 'Alertas enviadas correctamente']);
            }
            return response()->json(['message' => 'No hay alertas para enviar en este momento']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al enviar: ' . $e->getMessage()], 500);
        }
    }
}

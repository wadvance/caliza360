<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group');
        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|max:255',
            'settings.*.value' => 'required|string|max:1000',
            'settings.*.group' => 'required|string|max:100',
        ]);

        foreach ($request->settings as $item) {
            Setting::set($item['key'], $item['value'], $item['group']);
        }

        return response()->json(['message' => 'Configuración actualizada correctamente']);
    }

    public function getCompanyInfo(): JsonResponse
    {
        $keys = ['company_name', 'company_rfc', 'company_address', 'company_phone', 'company_email'];
        $company = [];

        foreach ($keys as $key) {
            $company[$key] = Setting::get($key);
        }

        return response()->json($company);
    }

    public function updateCompanyInfo(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'rfc' => 'nullable|string|max:13',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        $mapping = [
            'name' => 'company_name',
            'rfc' => 'company_rfc',
            'address' => 'company_address',
            'phone' => 'company_phone',
            'email' => 'company_email',
        ];

        foreach ($mapping as $input => $key) {
            if ($request->has($input)) {
                Setting::set($key, $request->input($input), 'company');
            }
        }

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateSettings(Setting::where('group', 'company')->pluck('value', 'key')->toArray());
        }

        return response()->json(['message' => 'Información de la empresa actualizada correctamente']);
    }
}

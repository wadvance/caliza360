<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PanamaController extends Controller
{
    /**
     * División política de Panamá: provincias, distritos y corregimientos.
     */
    public function locations(): JsonResponse
    {
        return response()->json(config('panama'));
    }
}

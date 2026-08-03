<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckScreenPermission
{
    /**
     * Protege las rutas API por módulo. El mapa de módulos se resuelve
     * desde el segmento inicial de la URI (p. ej. /api/trips -> trips).
     */
    public function handle(Request $request, Closure $next, string $screen): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if (!$user->canAccessScreen($screen)) {
            return response()->json([
                'message' => 'No tienes permiso para acceder a este módulo.',
            ], 403);
        }

        return $next($request);
    }
}

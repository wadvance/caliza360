<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SecretaryAgenda;
use App\Models\SecretaryReception;
use App\Models\SecretaryDocument;
use App\Models\SecretaryLogistic;
use App\Models\WhatsAppConversation;
use App\Models\OfficeNote;
use App\Models\PettyCash;
use Illuminate\Http\Request;

class SecretaryDashboardController extends Controller
{
    /**
     * Espacio de trabajo de la secretaria.
     * Incluye las funciones de secretaría y los resúmenes esenciales.
     */

    // ============================ AGENDA ============================

    public function agendaIndex(Request $request)
    {
        $query = SecretaryAgenda::with('creator:id,name')
            ->orderBy('starts_at');

        if ($request->filled('date')) {
            $query->whereDate('starts_at', $request->date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function agendaStore(Request $request)
    {
        $data = $this->validateAgenda($request);

        $data['starts_at'] = \Carbon\Carbon::parse($request->starts_at);
        $data['ends_at'] = \Carbon\Carbon::parse($request->ends_at);

        if ($data['ends_at']->lte($data['starts_at'])) {
            return response()->json(['message' => 'La hora de fin debe ser posterior a la de inicio.'], 422);
        }

        if ($this->agendaHasOverlap($data['starts_at'], $data['ends_at'])) {
            return response()->json([
                'message' => 'Superposición de eventos: ya existe una cita o reunión programada en ese horario.',
            ], 422);
        }

        $event = SecretaryAgenda::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($event->load('creator:id,name'), 201);
    }

    public function agendaUpdate(Request $request, SecretaryAgenda $event)
    {
        $data = $this->validateAgenda($request);

        $data['starts_at'] = \Carbon\Carbon::parse($request->starts_at);
        $data['ends_at'] = \Carbon\Carbon::parse($request->ends_at);

        if ($data['ends_at']->lte($data['starts_at'])) {
            return response()->json(['message' => 'La hora de fin debe ser posterior a la de inicio.'], 422);
        }

        if ($this->agendaHasOverlap($data['starts_at'], $data['ends_at'], $event->id)) {
            return response()->json([
                'message' => 'Superposición de eventos: ya existe una cita o reunión programada en ese horario.',
            ], 422);
        }

        $event->update($data);

        return response()->json($event->load('creator:id,name'));
    }

    public function agendaDestroy(SecretaryAgenda $event)
    {
        $event->delete();

        return response()->json(['message' => 'Evento eliminado correctamente']);
    }

    protected function agendaHasOverlap($startsAt, $endsAt, ?int $excludeId = null): bool
    {
        $query = SecretaryAgenda::where('status', '!=', SecretaryAgenda::STATUS_CANCELADA)
            // Un evento existente se superpone si comienza antes de que el nuevo termine
            // y termina después de que el nuevo comienza.
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    protected function validateAgenda(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'event_type' => 'required|in:cita,reunion',
            'mode' => 'required|in:presencial,virtual',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date',
            'participants' => 'nullable|string|max:500',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', SecretaryAgenda::STATUSES),
        ]);
    }

    // ============================ RECEPCIÓN ============================

    public function receptionIndex(Request $request)
    {
        $query = SecretaryReception::with('creator:id,name')
            ->orderByDesc('attended_at');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('date')) {
            $query->whereDate('attended_at', $request->date);
        }

        return response()->json($query->get());
    }

    public function receptionStore(Request $request)
    {
        $data = $this->validateReception($request);

        $record = SecretaryReception::create([
            ...$data,
            'attended_at' => $request->filled('attended_at') ? \Carbon\Carbon::parse($request->attended_at) : now(),
            'created_by' => $request->user()->id,
        ]);

        return response()->json($record->load('creator:id,name'), 201);
    }

    public function receptionUpdate(Request $request, SecretaryReception $record)
    {
        $data = $this->validateReception($request);

        if ($request->filled('attended_at')) {
            $data['attended_at'] = \Carbon\Carbon::parse($request->attended_at);
        }

        $record->update($data);

        return response()->json($record->load('creator:id,name'));
    }

    public function receptionDestroy(SecretaryReception $record)
    {
        $record->delete();

        return response()->json(['message' => 'Registro eliminado correctamente']);
    }

    protected function validateReception(Request $request): array
    {
        return $request->validate([
            'type' => 'required|in:visita,llamada,consulta',
            'person_name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', SecretaryReception::STATUSES),
        ]);
    }

    // ============================ ARCHIVO ============================

    public function documentsIndex(Request $request)
    {
        $query = SecretaryDocument::with('creator:id,name')
            ->orderByDesc('created_at');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('format')) {
            $query->where('format', $request->format);
        }

        return response()->json($query->get());
    }

    public function documentsStore(Request $request)
    {
        $data = $this->validateDocument($request);

        $doc = SecretaryDocument::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($doc->load('creator:id,name'), 201);
    }

    public function documentsUpdate(Request $request, SecretaryDocument $doc)
    {
        $data = $this->validateDocument($request);

        $doc->update($data);

        return response()->json($doc->load('creator:id,name'));
    }

    public function documentsDestroy(SecretaryDocument $doc)
    {
        $doc->delete();

        return response()->json(['message' => 'Documento eliminado correctamente']);
    }

    protected function validateDocument(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'format' => 'required|in:' . implode(',', SecretaryDocument::FORMATS),
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);
    }

    // ============================ LOGÍSTICA ============================

    public function logisticsIndex(Request $request)
    {
        $query = SecretaryLogistic::with('creator:id,name')
            ->orderByDesc('created_at');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function logisticsStore(Request $request)
    {
        $data = $this->validateLogistic($request);

        if ($request->filled('date')) {
            $data['date'] = \Carbon\Carbon::parse($request->date);
        }

        $item = SecretaryLogistic::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function logisticsUpdate(Request $request, SecretaryLogistic $item)
    {
        $data = $this->validateLogistic($request);

        if ($request->filled('date')) {
            $data['date'] = \Carbon\Carbon::parse($request->date);
        }

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function logisticsDestroy(SecretaryLogistic $item)
    {
        $item->delete();

        return response()->json(['message' => 'Registro eliminado correctamente']);
    }

    protected function validateLogistic(Request $request): array
    {
        return $request->validate([
            'type' => 'required|in:sala,suministro,viaje,reserva',
            'title' => 'required|string|max:255',
            'details' => 'nullable|string',
            'date' => 'nullable|date',
            'status' => 'sometimes|in:' . implode(',', SecretaryLogistic::STATUSES),
        ]);
    }

    // ============================ RESUMEN ============================

    public function summary()
    {
        $today = now()->toDateString();

        return response()->json([
            'agenda' => [
                'today' => SecretaryAgenda::whereDate('starts_at', $today)->where('status', '!=', SecretaryAgenda::STATUS_CANCELADA)->count(),
                'upcoming' => SecretaryAgenda::where('starts_at', '>=', now())->where('status', '!=', SecretaryAgenda::STATUS_CANCELADA)->count(),
            ],
            'reception' => [
                'today' => SecretaryReception::whereDate('attended_at', $today)->count(),
                'pending' => SecretaryReception::where('status', SecretaryReception::STATUS_RECIBIDO)->count(),
            ],
            'documents' => SecretaryDocument::count(),
            'logistics' => [
                'pending' => SecretaryLogistic::where('status', SecretaryLogistic::STATUS_PENDIENTE)->count(),
                'in_progress' => SecretaryLogistic::where('status', SecretaryLogistic::STATUS_EN_PROCESO)->count(),
            ],
            'whatsapp' => [
                'unread' => WhatsAppConversation::where('unread_count', '>', 0)->count(),
            ],
            'notes' => OfficeNote::count(),
            'petty_cash' => [
                'balance' => PettyCash::where('type', PettyCash::TYPE_ENTRADA)->sum('amount')
                    - PettyCash::where('type', PettyCash::TYPE_SALIDA)->sum('amount'),
            ],
        ]);
    }
}

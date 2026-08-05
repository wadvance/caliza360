<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlantPersonnel;
use App\Models\SupervisorPlanning;
use App\Models\SupervisorReception;
use App\Models\SupervisorBlending;
use App\Models\SupervisorQuality;
use App\Models\SupervisorSafety;
use App\Models\SupervisorTask;
use Illuminate\Http\Request;

class SupervisorDashboardController extends Controller
{
    /**
     * Espacio de trabajo del supervisor de planta.
     * Incluye: control de producción y materia prima (planificación, recepción y
     * trituración, mezclado), gestión de calidad, seguridad y medio ambiente,
     * y liderazgo de equipo.
     */

    // ============================ PERSONAL DE PLANTA ============================

    public function personnelIndex(Request $request)
    {
        $query = PlantPersonnel::with('creator:id,name')->orderBy('name');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function personnelStore(Request $request)
    {
        $data = $this->validatePersonnel($request);

        $item = PlantPersonnel::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function personnelUpdate(Request $request, PlantPersonnel $item)
    {
        $data = $this->validatePersonnel($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function personnelDestroy(PlantPersonnel $item)
    {
        $item->delete();

        return response()->json(['message' => 'Personal eliminado correctamente']);
    }

    protected function validatePersonnel(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'status' => 'sometimes|in:' . implode(',', PlantPersonnel::STATUSES),
        ]);
    }

    // ============================ PLANIFICACIÓN ============================

    public function planningIndex(Request $request)
    {
        $query = SupervisorPlanning::with('creator:id,name')
            ->orderBy('planned_date');

        if ($request->filled('date')) {
            $query->whereDate('planned_date', $request->date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function planningStore(Request $request)
    {
        $data = $this->validatePlanning($request);

        $item = SupervisorPlanning::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function planningUpdate(Request $request, SupervisorPlanning $item)
    {
        $data = $this->validatePlanning($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function planningDestroy(SupervisorPlanning $item)
    {
        $item->delete();

        return response()->json(['message' => 'Actividad eliminada correctamente']);
    }

    protected function validatePlanning(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'activity_type' => 'sometimes|in:extraccion,procesamiento,chancado,mezclado,mantenimiento,otro',
            'planned_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'area' => 'nullable|string|max:255',
            'assigned_person' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', SupervisorPlanning::STATUSES),
        ]);
    }

    // ============================ RECEPCIÓN Y TRITURACIÓN ============================

    public function receptionIndex(Request $request)
    {
        $query = SupervisorReception::with('creator:id,name')
            ->orderBy('processed_date');

        if ($request->filled('stage')) {
            $query->where('stage', $request->stage);
        }

        if ($request->filled('date')) {
            $query->whereDate('processed_date', $request->date);
        }

        return response()->json($query->get());
    }

    public function receptionStore(Request $request)
    {
        $data = $this->validateReception($request);

        $item = SupervisorReception::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function receptionUpdate(Request $request, SupervisorReception $item)
    {
        $data = $this->validateReception($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function receptionDestroy(SupervisorReception $item)
    {
        $item->delete();

        return response()->json(['message' => 'Registro eliminado correctamente']);
    }

    protected function validateReception(Request $request): array
    {
        return $request->validate([
            'stage' => 'sometimes|in:recepcion,chancado_primario,chancado_secundario',
            'material' => 'required|string|max:255',
            'tonnage' => 'nullable|numeric|min:0',
            'processed_date' => 'required|date',
            'origin' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', SupervisorReception::STATUSES),
        ]);
    }

    // ============================ MEZCLADO (BLENDING) ============================

    public function blendingIndex(Request $request)
    {
        $query = SupervisorBlending::with('creator:id,name')
            ->orderBy('blend_date');

        if ($request->filled('date')) {
            $query->whereDate('blend_date', $request->date);
        }

        return response()->json($query->get());
    }

    public function blendingStore(Request $request)
    {
        $data = $this->validateBlending($request);

        $item = SupervisorBlending::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function blendingUpdate(Request $request, SupervisorBlending $item)
    {
        $data = $this->validateBlending($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function blendingDestroy(SupervisorBlending $item)
    {
        $item->delete();

        return response()->json(['message' => 'Mezcla eliminada correctamente']);
    }

    protected function validateBlending(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'materials' => 'nullable|string|max:500',
            'target_spec' => 'nullable|numeric|min:0',
            'blend_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', SupervisorBlending::STATUSES),
        ]);
    }

    // ============================ GESTIÓN DE CALIDAD ============================

    public function qualityIndex(Request $request)
    {
        $query = SupervisorQuality::with('creator:id,name')
            ->orderBy('checked_date');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('checked_date', $request->date);
        }

        return response()->json($query->get());
    }

    public function qualityStore(Request $request)
    {
        $data = $this->validateQuality($request);

        $item = SupervisorQuality::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function qualityUpdate(Request $request, SupervisorQuality $item)
    {
        $data = $this->validateQuality($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function qualityDestroy(SupervisorQuality $item)
    {
        $item->delete();

        return response()->json(['message' => 'Control de calidad eliminado correctamente']);
    }

    protected function validateQuality(Request $request): array
    {
        return $request->validate([
            'material' => 'required|string|max:255',
            'purity' => 'nullable|numeric|between:0,100',
            'granulometry' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'checked_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', SupervisorQuality::STATUSES),
        ]);
    }

    // ============================ SEGURIDAD Y MEDIO AMBIENTE ============================

    public function safetyIndex(Request $request)
    {
        $query = SupervisorSafety::with('creator:id,name')
            ->orderBy('checked_date');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function safetyStore(Request $request)
    {
        $data = $this->validateSafety($request);

        $item = SupervisorSafety::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function safetyUpdate(Request $request, SupervisorSafety $item)
    {
        $data = $this->validateSafety($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function safetyDestroy(SupervisorSafety $item)
    {
        $item->delete();

        return response()->json(['message' => 'Registro de seguridad eliminado correctamente']);
    }

    protected function validateSafety(Request $request): array
    {
        return $request->validate([
            'type' => 'sometimes|in:' . implode(',', SupervisorSafety::TYPES),
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'risk_level' => 'sometimes|in:bajo,medio,alto,critico',
            'status' => 'sometimes|in:' . implode(',', SupervisorSafety::STATUSES),
            'checked_date' => 'required|date',
            'action_plan' => 'nullable|string',
        ]);
    }

    // ============================ LIDERAZGO DE EQUIPO ============================

    public function tasksIndex(Request $request)
    {
        $query = SupervisorTask::with('assigner:id,name')
            ->orderBy('due_date');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function tasksStore(Request $request)
    {
        $data = $this->validateTask($request);

        $item = SupervisorTask::create([
            ...$data,
            'assigned_by' => $request->user()->id,
        ]);

        return response()->json($item->load('assigner:id,name'), 201);
    }

    public function tasksUpdate(Request $request, SupervisorTask $item)
    {
        $data = $this->validateTask($request);

        $item->update($data);

        return response()->json($item->load('assigner:id,name'));
    }

    public function tasksDestroy(SupervisorTask $item)
    {
        $item->delete();

        return response()->json(['message' => 'Tarea eliminada correctamente']);
    }

    protected function validateTask(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'assignee' => 'nullable|string|max:255',
            'priority' => 'sometimes|in:alta,media,baja',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', SupervisorTask::STATUSES),
        ]);
    }

    // ============================ RESUMEN ============================

    public function summary()
    {
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        return response()->json([
            'production' => [
                'planned_today' => SupervisorPlanning::whereDate('planned_date', $today)
                    ->where('status', '!=', SupervisorPlanning::STATUS_CANCELADO)->count(),
                'reception_today' => SupervisorReception::whereDate('processed_date', $today)->count(),
                'tonnage_month' => SupervisorReception::whereBetween('processed_date', [$monthStart, $monthEnd])
                    ->where('status', '!=', SupervisorReception::STATUS_CANCELADO)
                    ->sum('tonnage'),
                'blending_month' => SupervisorBlending::whereBetween('blend_date', [$monthStart, $monthEnd])
                    ->where('status', '!=', SupervisorBlending::STATUS_CANCELADO)->count(),
            ],
            'quality' => [
                'checked_month' => SupervisorQuality::whereBetween('checked_date', [$monthStart, $monthEnd])->count(),
                'non_compliant' => SupervisorQuality::where('status', SupervisorQuality::STATUS_NO_CUMPLE)->count(),
            ],
            'safety' => [
                'open' => SupervisorSafety::whereIn('status', [SupervisorSafety::STATUS_PENDIENTE, SupervisorSafety::STATUS_EN_ATENCION, SupervisorSafety::STATUS_INCUMPLIDO])->count(),
                'verified' => SupervisorSafety::where('status', SupervisorSafety::STATUS_VERIFICADO)->count(),
                'high_risk' => SupervisorSafety::whereIn('risk_level', ['alto', 'critico'])
                    ->where('status', '!=', SupervisorSafety::STATUS_VERIFICADO)->count(),
            ],
            'team' => [
                'pending_tasks' => SupervisorTask::whereIn('status', [SupervisorTask::STATUS_PENDIENTE, SupervisorTask::STATUS_EN_PROCESO])->count(),
                'completed_tasks' => SupervisorTask::where('status', SupervisorTask::STATUS_COMPLETADA)->count(),
                'high_priority' => SupervisorTask::where('priority', SupervisorTask::PRIORITY_ALTA)
                    ->where('status', '!=', SupervisorTask::STATUS_COMPLETADA)->count(),
            ],
        ]);
    }
}

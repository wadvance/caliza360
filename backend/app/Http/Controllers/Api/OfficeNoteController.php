<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OfficeNote;
use App\Services\WordNoteService;
use Illuminate\Http\Request;

class OfficeNoteController extends Controller
{
    /**
     * Notas de oficina: memorandos, minutas, oficios, comunicados, etc.
     */
    public function index(Request $request)
    {
        $query = OfficeNote::with(['creator:id,name', 'updater:id,name'])
            ->orderByDesc('note_date')
            ->orderByDesc('id');

        if ($request->filled('note_type')) {
            $query->where('note_type', $request->note_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('note_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('note_date', '<=', $request->end_date);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('body', 'like', '%' . $request->search . '%')
                    ->orWhere('related_to', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['note_number'] = $this->generateNumber($data['note_date']);
        $data['created_by'] = $request->user()->id;

        $note = OfficeNote::create($data);

        return response()->json($note->load(['creator:id,name']), 201);
    }

    public function show(OfficeNote $note)
    {
        return response()->json($note->load(['creator:id,name', 'updater:id,name']));
    }

    public function update(Request $request, OfficeNote $note)
    {
        $data = $this->validateData($request);

        $data['updated_by'] = $request->user()->id;

        $note->update($data);

        return response()->json($note->load(['creator:id,name', 'updater:id,name']));
    }

    public function destroy(OfficeNote $note)
    {
        $note->delete();

        return response()->json(['message' => 'Nota eliminada correctamente']);
    }

    /**
     * Descarga la nota como documento Word (.docx).
     */
    public function word(OfficeNote $note)
    {
        $service = app(WordNoteService::class);
        $content = $service->build($note->load('creator:id,name'));

        return response($content, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $service->filename($note) . '"',
            'Content-Length' => strlen($content),
        ]);
    }

    /**
     * Resumen de notas por tipo y estado.
     */
    public function summary(Request $request)
    {
        $byType = OfficeNote::select('note_type')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('note_type')
            ->get();

        $byStatus = OfficeNote::select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->get();

        return response()->json([
            'total_notes' => OfficeNote::count(),
            'total_final' => OfficeNote::where('status', OfficeNote::STATUS_FINAL)->count(),
            'total_draft' => OfficeNote::where('status', OfficeNote::STATUS_DRAFT)->count(),
            'by_type' => $byType,
            'by_status' => $byStatus,
        ]);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'note_type' => 'required|in:' . implode(',', OfficeNote::TYPES),
            'note_date' => 'required|date',
            'status' => 'required|in:' . implode(',', OfficeNote::STATUSES),
            'related_to' => 'nullable|string|max:255',
        ]);
    }

    protected function generateNumber(string $date): string
    {
        $day = substr($date, 0, 10);
        $count = OfficeNote::whereDate('note_date', $day)->count() + 1;

        return 'NT-' . str_replace('-', '', $day) . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}

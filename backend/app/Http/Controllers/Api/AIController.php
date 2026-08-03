<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    protected AIService $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Get maintenance prediction for a specific truck
     */
    public function predictMaintenance(string $truckId): JsonResponse
    {
        try {
            $prediction = $this->aiService->predictMaintenance($truckId);
            return response()->json(['data' => $prediction]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    /**
     * Get maintenance predictions for all active trucks
     */
    public function getFleetPredictions(): JsonResponse
    {
        try {
            $predictions = $this->aiService->getFleetPredictions();
            return response()->json(['data' => $predictions]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Predict trip cost before creating the trip
     */
    public function predictTripCost(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'distance' => 'required|numeric|min:1',
                'material_type' => 'required|string',
                'weight' => 'required|numeric|min:0.1',
            ]);

            $prediction = $this->aiService->predictTripCost($validated);
            return response()->json(['data' => $prediction]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Optimize route between two points
     */
    public function optimizeRoute(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'origin' => 'required|string',
                'destination' => 'required|string',
                'material_type' => 'required|string',
                'weight' => 'required|numeric|min:0.1',
                'departure_time' => 'nullable|string',
            ]);

            $optimization = $this->aiService->optimizeRoute($validated);
            return response()->json(['data' => $optimization]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}

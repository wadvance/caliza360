<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Inventory;
use App\Services\AIService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class AIServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AIService $aiService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->aiService = new AIService();
    }

    public function test_predict_maintenance_returns_prediction_for_valid_truck(): void
    {
        $truck = Truck::factory()->create([
            'current_mileage' => 50000,
            'status' => 'active',
        ]);

        $prediction = $this->aiService->predictMaintenance($truck->id);

        $this->assertArrayHasKey('truck_id', $prediction);
        $this->assertArrayHasKey('truck_plate', $prediction);
        $this->assertArrayHasKey('current_mileage', $prediction);
        $this->assertArrayHasKey('km_until_service', $prediction);
        $this->assertArrayHasKey('alert', $prediction);
        $this->assertArrayHasKey('severity', $prediction);
        $this->assertEquals($truck->id, $prediction['truck_id']);
    }

    public function test_predict_maintenance_throws_exception_for_invalid_truck(): void
    {
        $this->expectException(\Exception::class);
        $this->aiService->predictMaintenance('non-existent-id');
    }

    public function test_predict_maintenance_generates_default_when_no_history(): void
    {
        $truck = Truck::factory()->create([
            'current_mileage' => 30000,
            'status' => 'active',
        ]);

        $prediction = $this->aiService->predictMaintenance($truck->id);

        $this->assertEquals(45000, $prediction['next_service_km']);
        $this->assertEquals(15000, $prediction['km_until_service']);
        $this->assertFalse($prediction['alert']);
    }

    public function test_get_fleet_predictions_returns_array(): void
    {
        Truck::factory()->count(3)->create(['status' => 'active']);

        $predictions = $this->aiService->getFleetPredictions();

        $this->assertIsArray($predictions);
        $this->assertCount(3, $predictions);
    }

    public function test_predict_trip_cost_returns_cost_breakdown(): void
    {
        $result = $this->aiService->predictTripCost([
            'distance' => 100,
            'material_type' => 'Caliza',
            'weight' => 25,
        ]);

        $this->assertArrayHasKey('estimated_cost', $result);
        $this->assertArrayHasKey('cost_breakdown', $result);
        $this->assertArrayHasKey('estimated_revenue', $result);
        $this->assertArrayHasKey('estimated_profit', $result);
        $this->assertArrayHasKey('profit_margin', $result);
        $this->assertGreaterThan(0, $result['estimated_cost']);
    }

    public function test_predict_trip_cost_calculates_correctly(): void
    {
        $result = $this->aiService->predictTripCost([
            'distance' => 100,
            'material_type' => 'Caliza',
            'weight' => 25,
        ]);

        $this->assertEquals(850, $result['cost_breakdown']['fuel']);
        $this->assertEquals(320, $result['cost_breakdown']['driver']);
        $this->assertEquals(180, $result['cost_breakdown']['maintenance']);
    }

    public function test_optimize_route_returns_route_info(): void
    {
        $result = $this->aiService->optimizeRoute([
            'origin' => 'Cantera Norte',
            'destination' => 'Centro',
            'material_type' => 'Caliza',
            'weight' => 25,
            'departure_time' => '06:00',
        ]);

        $this->assertArrayHasKey('distance_km', $result);
        $this->assertArrayHasKey('duration_minutes', $result);
        $this->assertArrayHasKey('fuel_needed_liters', $result);
        $this->assertArrayHasKey('estimated_arrival', $result);
        $this->assertArrayHasKey('traffic_level', $result);
        $this->assertArrayHasKey('suggested_departures', $result);
        $this->assertArrayHasKey('recommendations', $result);
    }

    public function test_optimize_route_detects_peak_hours(): void
    {
        $result = $this->aiService->optimizeRoute([
            'origin' => 'Cantera Norte',
            'destination' => 'Centro',
            'material_type' => 'Caliza',
            'weight' => 25,
            'departure_time' => '08:00',
        ]);

        $this->assertTrue($result['is_peak_hour']);
        $this->assertEquals('Alto', $result['traffic_level']);
    }

    public function test_optimize_route_non_peak_hours(): void
    {
        $result = $this->aiService->optimizeRoute([
            'origin' => 'Cantera Norte',
            'destination' => 'Centro',
            'material_type' => 'Caliza',
            'weight' => 25,
            'departure_time' => '06:00',
        ]);

        $this->assertFalse($result['is_peak_hour']);
        $this->assertEquals('Normal', $result['traffic_level']);
    }

    public function test_predict_maintenance_uses_python_service_when_enabled(): void
    {
        config(['services.ai_service.enabled' => true]);
        config(['services.ai_service.url' => 'http://127.0.0.1:5000']);

        Http::fake([
            '*/api/ai/predict-maintenance' => Http::response([
                'predicted_km_until_service' => 150,
                'predicted_date' => '2026-08-10',
                'confidence' => 0.88,
                'recommended_actions' => ['Revisar frenos'],
            ], 200),
        ]);

        $truck = Truck::factory()->create([
            'current_mileage' => 50000,
            'status' => 'active',
        ]);

        $prediction = $this->aiService->predictMaintenance($truck->id);

        $this->assertEquals('ml_regression', $prediction['method']);
        $this->assertEquals(150, $prediction['km_until_service']);
        $this->assertTrue($prediction['alert']);
        $this->assertEquals('high', $prediction['severity']);
    }

    public function test_predict_maintenance_falls_back_to_heuristic_when_service_down(): void
    {
        config(['services.ai_service.enabled' => true]);
        config(['services.ai_service.url' => 'http://127.0.0.1:5000']);

        Http::fake([
            'ai/*' => Http::response('Service unavailable', 500),
        ]);

        $truck = Truck::factory()->create([
            'current_mileage' => 50000,
            'status' => 'active',
        ]);

        $prediction = $this->aiService->predictMaintenance($truck->id);

        // El heurístico no exporta el campo "method": queda "rules".
        $this->assertEquals('rules', $prediction['method'] ?? 'rules');
        $this->assertEquals(50000, $prediction['current_mileage']);
    }

    public function test_optimize_route_falls_back_when_service_unavailable(): void
    {
        config(['services.ai_service.enabled' => true]);
        config(['services.ai_service.url' => 'http://127.0.0.1:5000']);

        Http::fake([
            'ai/*' => Http::response('Service unavailable', 500),
        ]);

        $result = $this->aiService->optimizeRoute([
            'origin' => 'Cantera Norte',
            'destination' => 'Centro',
            'material_type' => 'Caliza',
            'weight' => 25,
            'departure_time' => '08:00',
        ]);

        $this->assertArrayHasKey('distance_km', $result);
        $this->assertArrayHasKey('duration_minutes', $result);
        $this->assertTrue($result['is_peak_hour']);
    }
}

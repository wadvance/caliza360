<?php

namespace Database\Seeders;

use App\Models\AccountReceivable;
use App\Models\Alert;
use App\Models\Client;
use App\Models\DailyMetrics;
use App\Models\Driver;
use App\Models\Inventory;
use App\Models\Invoice;
use App\Models\Maintenance;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\Trip;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ============ USUARIOS ============
        $superAdmin = User::create([
            'name' => 'Super Administrador',
            'email' => 'superadmin@calizalosos.com',
            'password' => 'password123',
            'role' => 'super_admin',
            'phone' => '555-0000',
        ]);

        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@calizalosos.com',
            'password' => 'password123',
            'role' => 'admin',
            'phone' => '555-0101',
        ]);

        User::create([
            'name' => 'Despacho Central',
            'email' => 'despacho@calizalosos.com',
            'password' => 'password123',
            'role' => 'dispatcher',
            'phone' => '555-0102',
        ]);

        User::create([
            'name' => 'Contabilidad',
            'email' => 'contabilidad@calizalosos.com',
            'password' => 'password123',
            'role' => 'accountant',
            'phone' => '555-0103',
        ]);

        User::create([
            'name' => 'Supervisor de Planta',
            'email' => 'supervisor@calizalosos.com',
            'password' => 'password123',
            'role' => 'supervisor',
            'phone' => '555-0104',
        ]);

        User::create([
            'name' => 'Secretaria de Oficina',
            'email' => 'secretaria@calizalosos.com',
            'password' => 'password123',
            'role' => 'secretary',
            'phone' => '555-0105',
        ]);

        $driverUser1 = User::create([
            'name' => 'Carlos Mendoza',
            'email' => 'conductor@calizalosos.com',
            'password' => 'password123',
            'role' => 'driver',
            'phone' => '555-0201',
        ]);

        $driverUser2 = User::create([
            'name' => 'Jorge Ramírez',
            'email' => 'jorge.ramirez@calizalosos.com',
            'password' => 'password123',
            'role' => 'driver',
            'phone' => '555-0202',
        ]);

        // ============ PROVEEDORES ============
        $fuelSupplier = Supplier::create([
            'name' => 'Estación de Combustible Penonomé',
            'company' => 'Combustibles Azuero',
            'email' => 'ventas@combustiblesazuero.pa',
            'phone' => '555-0301',
            'address' => 'Corregimiento Penonomé, Distrito de Penonomé, Coclé',
            'rfc' => 'PAC-123-456',
            'material_type' => 'Combustible',
        ]);

        $tireSupplier = Supplier::create([
            'name' => 'Llantas y Servicios Chiriquí',
            'company' => 'Llantas Chiriquí',
            'email' => 'contacto@llantaschiriqui.pa',
            'phone' => '555-0302',
            'address' => 'Corregimiento David, Distrito de David, Chiriquí',
            'rfc' => 'LCD-234-567',
            'material_type' => 'Llantas',
        ]);

        $partsSupplier = Supplier::create([
            'name' => 'Refacciones Industriales Colón',
            'company' => 'Refacciones del Atlántico',
            'email' => 'refacciones@atlantico.pa',
            'phone' => '555-0303',
            'address' => 'Corregimiento Barrio Sur, Distrito de Colón, Colón',
            'rfc' => 'RAC-345-678',
            'material_type' => 'Refacciones',
        ]);

        // ============ CLIENTES ============
        $client1 = Client::create([
            'name' => 'Cemento Panamá',
            'company' => 'Cemento Panamá, S.A.',
            'email' => 'compras@cementopanama.pa',
            'phone' => '800-0404',
            'address' => 'Corregimiento El Coco, Distrito de Penonomé, Coclé',
            'rfc' => 'PAC-112233-1',
            'credit_limit' => 1500000.00,
            'rating' => 4.8,
            'notes' => 'Cliente principal, requiere entregas programadas.',
        ]);

        $client2 = Client::create([
            'name' => 'Concretos Panamá',
            'company' => 'Concretos Nacionales, S.A.',
            'email' => 'pedidos@concretospanama.pa',
            'phone' => '800-0505',
            'address' => 'Corregimiento San Francisco, Distrito de Panamá, Panamá',
            'rfc' => 'PAC-445566-2',
            'credit_limit' => 600000.00,
            'rating' => 4.2,
        ]);

        $client3 = Client::create([
            'name' => 'Constructora del Istmo',
            'company' => 'Constructora del Istmo y Asociados',
            'email' => 'admin@constructoraistmo.pa',
            'phone' => '800-0606',
            'address' => 'Corregimiento La Chorrera, Distrito de La Chorrera, Panamá Oeste',
            'rfc' => 'PAC-778899-3',
            'credit_limit' => 300000.00,
            'rating' => 3.9,
        ]);

        // ============ CAMIONES ============
        $truck1 = Truck::create([
            'plate' => 'ABC-1234',
            'brand' => 'Kenworth',
            'model' => 'T800',
            'year' => 2021,
            'color' => 'Rojo',
            'vin_number' => '1XKWDR0X4PJ102345',
            'engine_type' => 'Diésel',
            'capacity' => 42,
            'current_mileage' => 185000,
            'status' => 'active',
            'insurance_provider' => 'GNP Seguros',
            'insurance_policy_number' => 'POL-9901',
            'insurance_start_date' => '2026-01-15',
            'insurance_end_date' => '2026-12-31',
            'insurance_cost' => 18500.00,
            'circulation_card_number' => 'CC-22110',
            'circulation_card_expiry' => '2027-03-20',
        ]);

        $truck2 = Truck::create([
            'plate' => 'XYZ-7890',
            'brand' => 'Freightliner',
            'model' => 'Cascadia',
            'year' => 2020,
            'color' => 'Blanco',
            'vin_number' => '3RJ7890XHK456789',
            'engine_type' => 'Diésel',
            'capacity' => 45,
            'current_mileage' => 210500,
            'status' => 'maintenance',
            'insurance_provider' => 'AXA Seguros',
            'insurance_policy_number' => 'AX-7788',
            'insurance_start_date' => '2026-03-01',
            'insurance_end_date' => '2026-12-31',
            'insurance_cost' => 19900.00,
            'circulation_card_number' => 'CC-33221',
            'circulation_card_expiry' => '2026-11-05',
        ]);

        $truck3 = Truck::create([
            'plate' => 'LMN-2345',
            'brand' => 'Volvo',
            'model' => 'FH16',
            'year' => 2023,
            'color' => 'Azul',
            'vin_number' => '1V9FH1604R202002',
            'engine_type' => 'Diésel',
            'capacity' => 48,
            'current_mileage' => 62000,
            'status' => 'active',
            'insurance_provider' => 'Qualitas',
            'insurance_policy_number' => 'QL-5566',
            'insurance_start_date' => '2026-05-10',
            'insurance_end_date' => '2027-05-10',
            'insurance_cost' => 21000.00,
            'circulation_card_number' => 'CC-11223',
            'circulation_card_expiry' => '2027-02-14',
        ]);

        // ============ MANTENIMIENTOS ============
        Maintenance::create([
            'truck_id' => $truck1->id,
            'type' => 'preventive',
            'description' => 'Cambio de aceite y filtros',
            'service_date' => '2026-07-10',
            'mileage_at_service' => 180000,
            'cost' => 6500.00,
            'status' => 'completed',
            'next_maintenance_date' => '2026-10-10',
            'next_mileage' => 190000,
        ]);

        Maintenance::create([
            'truck_id' => $truck1->id,
            'type' => 'corrective',
            'description' => 'Reparación de sistema de frenos',
            'service_date' => '2026-06-20',
            'mileage_at_service' => 176000,
            'cost' => 12400.00,
            'status' => 'completed',
        ]);

        Maintenance::create([
            'truck_id' => $truck2->id,
            'type' => 'preventive',
            'description' => 'Servicio mayor programado',
            'service_date' => '2026-08-01',
            'mileage_at_service' => 203000,
            'cost' => 18500.00,
            'status' => 'in_progress',
            'next_maintenance_date' => '2026-09-01',
            'next_mileage' => 213000,
        ]);

        Maintenance::create([
            'truck_id' => $truck3->id,
            'type' => 'preventive',
            'description' => 'Cambio de aceite a los 60,000 km',
            'service_date' => '2026-07-25',
            'mileage_at_service' => 60000,
            'cost' => 7200.00,
            'status' => 'completed',
            'next_maintenance_date' => '2026-10-25',
            'next_mileage' => 70000,
        ]);

        // ============ CONDUCTORES ============
        $driver1 = Driver::create([
            'user_id' => $driverUser1->id,
            'name' => 'Carlos Mendoza',
            'license_number' => 'LIC-99887',
            'license_type' => 'C',
            'license_expiry_date' => '2027-03-15',
            'curp' => '4-740-1152',
            'rfc' => 'PE-123456',
            'phone' => '555-0201',
            'emergency_contact_name' => 'María López',
            'emergency_contact_phone' => '555-0901',
            'emergency_contact_relationship' => 'Esposa',
            'address' => 'Corregimiento El Coco, Distrito de Penonomé, Coclé',
            'hire_date' => '2023-02-01',
            'status' => 'active',
            'current_truck_id' => $truck1->id,
            'total_trips' => 320,
            'total_hours_worked' => 1850,
            'rating' => 4.7,
        ]);

        $driver2 = Driver::create([
            'user_id' => $driverUser2->id,
            'name' => 'Jorge Ramírez',
            'license_number' => 'LIC-44556',
            'license_type' => 'C',
            'license_expiry_date' => '2026-12-01',
            'curp' => '8-345-221',
            'rfc' => 'PP-654321',
            'phone' => '555-0202',
            'emergency_contact_name' => 'Lucía Ramírez',
            'emergency_contact_phone' => '555-0902',
            'emergency_contact_relationship' => 'Hermana',
            'address' => 'Corregimiento San Francisco, Distrito de Panamá, Panamá',
            'hire_date' => '2024-06-15',
            'status' => 'active',
            'current_truck_id' => $truck3->id,
            'total_trips' => 150,
            'total_hours_worked' => 980,
            'rating' => 4.4,
        ]);

        // ============ INVENTARIO ============
        $invCaliza = Inventory::create([
            'name' => 'Caliza Natural',
            'material_type' => 'Caliza',
            'current_stock' => 2500,
            'unit' => 'ton',
            'min_stock' => 800,
            'max_stock' => 5000,
            'unit_cost' => 220.00,
            'location' => 'Bodega Principal',
            'last_entry' => '2026-08-01',
            'status' => 'normal',
        ]);

        $invArena = Inventory::create([
            'name' => 'Arena de Río',
            'material_type' => 'Arena',
            'current_stock' => 450,
            'unit' => 'ton',
            'min_stock' => 600,
            'max_stock' => 2000,
            'unit_cost' => 180.00,
            'location' => 'Cantera Norte',
            'last_exit' => '2026-08-01',
            'status' => 'low',
        ]);

        $invGrava = Inventory::create([
            'name' => 'Grava 3/4',
            'material_type' => 'Grava',
            'current_stock' => 1200,
            'unit' => 'ton',
            'min_stock' => 500,
            'max_stock' => 3000,
            'unit_cost' => 210.00,
            'location' => 'Bodega Principal',
            'last_entry' => '2026-07-28',
            'status' => 'normal',
        ]);

        // ============ INVENTARIO - OFICINA ============
        $officeItems = [
            ['name' => 'Tinta Negra', 'material_type' => 'Papelería', 'current_stock' => 5, 'unit' => 'unidad', 'min_stock' => 2, 'max_stock' => 10, 'unit_cost' => 45.00],
            ['name' => 'Tinta Magenta', 'material_type' => 'Papelería', 'current_stock' => 4, 'unit' => 'unidad', 'min_stock' => 2, 'max_stock' => 10, 'unit_cost' => 55.00],
            ['name' => 'Tinta Amarilla', 'material_type' => 'Papelería', 'current_stock' => 4, 'unit' => 'unidad', 'min_stock' => 2, 'max_stock' => 10, 'unit_cost' => 55.00],
            ['name' => 'Papel Bond', 'material_type' => 'Papelería', 'current_stock' => 30, 'unit' => 'resma', 'min_stock' => 10, 'max_stock' => 60, 'unit_cost' => 120.00],
            ['name' => 'Lápices', 'material_type' => 'Papelería', 'current_stock' => 48, 'unit' => 'caja', 'min_stock' => 12, 'max_stock' => 60, 'unit_cost' => 25.00],
            ['name' => 'Borradores', 'material_type' => 'Papelería', 'current_stock' => 24, 'unit' => 'caja', 'min_stock' => 6, 'max_stock' => 40, 'unit_cost' => 15.00],
            ['name' => 'Bolígrafos', 'material_type' => 'Papelería', 'current_stock' => 36, 'unit' => 'caja', 'min_stock' => 12, 'max_stock' => 60, 'unit_cost' => 30.00],
            ['name' => 'Libreta de Facturas', 'material_type' => 'Documentos', 'current_stock' => 20, 'unit' => 'libreta', 'min_stock' => 5, 'max_stock' => 50, 'unit_cost' => 80.00],
            ['name' => 'Impresora', 'material_type' => 'Equipo de Oficina', 'current_stock' => 3, 'unit' => 'unidad', 'min_stock' => 1, 'max_stock' => 5, 'unit_cost' => 4500.00],
            ['name' => 'Silla de Escritorio', 'material_type' => 'Mobiliario', 'current_stock' => 8, 'unit' => 'unidad', 'min_stock' => 2, 'max_stock' => 15, 'unit_cost' => 1200.00],
            ['name' => 'Mesa de Escritorio', 'material_type' => 'Mobiliario', 'current_stock' => 5, 'unit' => 'unidad', 'min_stock' => 1, 'max_stock' => 10, 'unit_cost' => 2500.00],
        ];

        foreach ($officeItems as $officeItem) {
            Inventory::create([
                ...$officeItem,
                'location' => 'Oficina',
                'status' => 'normal',
            ]);
        }

        // ============ VIAJES ============
        $today = today();
        $now = Carbon::now();
        $pricePerTon = 320.00;

        $tripData = [
            ['status' => 'returned', 'days' => 4, 'weight' => 40, 'km' => 220, 'fuel' => 160, 'costs' => [6800, 500, 0, 350]],
            ['status' => 'delivered', 'days' => 3, 'weight' => 42, 'km' => 240, 'fuel' => 175, 'costs' => [7400, 520, 0, 200]],
            ['status' => 'delivered', 'days' => 2, 'weight' => 38, 'km' => 190, 'fuel' => 145, 'costs' => [6100, 450, 0, 150]],
            ['status' => 'returned', 'days' => 1, 'weight' => 44, 'km' => 250, 'fuel' => 180, 'costs' => [7600, 540, 0, 250]],
            ['status' => 'delivered', 'days' => 1, 'weight' => 45, 'km' => 235, 'fuel' => 170, 'costs' => [7200, 510, 0, 220]],
            ['status' => 'delivered', 'days' => 0, 'weight' => 43, 'km' => 230, 'fuel' => 165, 'costs' => [7000, 500, 0, 200]],
            ['status' => 'in_transit', 'days' => 0, 'weight' => 40, 'km' => null, 'fuel' => null, 'costs' => [0, 0, 0, 0]],
            ['status' => 'scheduled', 'days' => 0, 'weight' => 42, 'km' => null, 'fuel' => null, 'costs' => [0, 0, 0, 0]],
        ];

        $destinations = [
            $client1->id => ['name' => $client1->company, 'address' => $client1->address, 'lat' => 8.5300, 'lng' => -80.3400],
            $client2->id => ['name' => $client2->company, 'address' => $client2->address, 'lat' => 8.9833, 'lng' => -79.5167],
            $client3->id => ['name' => $client3->company, 'address' => $client3->address, 'lat' => 8.8800, 'lng' => -79.7830],
        ];

        foreach ($tripData as $i => $t) {
            $scheduledDate = $now->copy()->subDays($t['days']);
            $weight = $t['weight'];
            $totalAmount = round($weight * $pricePerTon, 2);
            $client = $i % 3 === 0 ? $client1 : ($i % 3 === 1 ? $client2 : $client3);
            $dest = $destinations[$client->id];

            $fields = [
                'driver_id' => $i % 2 === 0 ? $driver1->id : $driver2->id,
                'truck_id' => $i % 2 === 0 ? $truck1->id : $truck3->id,
                'client_id' => $client->id,
                'origin_name' => 'Cantera Los Osos Penonomé',
                'origin_address' => 'Corregimiento El Coco, Distrito de Penonomé, Coclé',
                'origin_lat' => 8.5300,
                'origin_lng' => -80.3400,
                'origin_quarry' => 'Cantera Penonomé',
                'destination_name' => $dest['name'],
                'destination_address' => $dest['address'],
                'destination_lat' => $dest['lat'],
                'destination_lng' => $dest['lng'],
                'destination_client' => $client->name,
                'material_type' => 'Caliza',
                'weight' => $weight,
                'price_per_ton' => $pricePerTon,
                'total_amount' => $totalAmount,
                'scheduled_date' => $scheduledDate,
                'scheduled_time' => '07:00:00',
                'status' => $t['status'],
                'fuel_cost' => $t['costs'][0],
                'tolls_cost' => $t['costs'][1],
                'maintenance_cost' => $t['costs'][2],
                'other_cost' => $t['costs'][3],
            ];

            if ($t['km'] !== null) {
                $fields['start_mileage'] = 120000 + $i * 15000;
                $fields['end_mileage'] = $fields['start_mileage'] + $t['km'];
                $fields['distance'] = $t['km'];
                $fields['fuel_start'] = 300;
                $fields['fuel_end'] = 300 - $t['fuel'];
                $fields['fuel_consumed'] = $t['fuel'];
                $fields['departure_time'] = $scheduledDate->copy()->addHours(6);
                $fields['arrival_time'] = $fields['departure_time']->copy()->addHours(3);
            }

            Trip::create($fields);
        }

        // ============ FACTURAS (ventas) ============
        $completedTrips = Trip::whereIn('status', ['delivered', 'returned'])->get();

        foreach ($completedTrips as $idx => $trip) {
            $subtotal = $trip->total_amount;
            $itbms = round($subtotal * 0.07, 2);
            $total = $subtotal + $itbms;
            $number = 'FAC-2026-' . str_pad($idx + 1, 3, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'invoice_number' => $number,
                'type' => 'sale',
                'client_id' => $trip->client_id,
                'items' => [
                    [
                        'description' => $trip->material_type . ' a granel',
                        'quantity' => $trip->weight,
                        'unit_price' => $trip->price_per_ton,
                        'total' => $trip->total_amount,
                        'material_type' => $trip->material_type,
                    ],
                ],
                'subtotal' => $subtotal,
                'iva' => $itbms,
                'total' => $total,
                'issue_date' => $trip->scheduled_date,
                'due_date' => $trip->scheduled_date->copy()->addDays(30),
                'status' => $idx % 2 === 0 ? 'paid' : 'sent',
                'payment_method' => $idx % 2 === 0 ? 'transfer' : null,
            ]);

            if ($invoice->status === 'paid') {
                AccountReceivable::create([
                    'client_id' => $trip->client_id,
                    'invoice_id' => $invoice->id,
                    'amount' => $trip->total_amount,
                    'paid_amount' => $trip->total_amount,
                    'balance' => 0,
                    'due_date' => $invoice->due_date,
                    'status' => 'paid',
                ]);
            } else {
                AccountReceivable::create([
                    'client_id' => $trip->client_id,
                    'invoice_id' => $invoice->id,
                    'amount' => $trip->total_amount,
                    'paid_amount' => 0,
                    'balance' => $trip->total_amount,
                    'due_date' => $invoice->due_date,
                    'status' => 'pending',
                ]);
            }
        }

        // ============ MÉTRICAS DIARIAS ============
        $totals = ['total_income' => 0, 'total_expenses' => 0, 'fuel' => 0];

        foreach ($completedTrips as $trip) {
            $totals['total_income'] += $trip->total_amount;
            $totals['total_expenses'] += $trip->getTotalCosts();
            $totals['fuel'] += $trip->fuel_consumed ?? 0;
        }

        DailyMetrics::create([
            'date' => today(),
            'total_trips' => $completedTrips->count(),
            'total_tons_transported' => $completedTrips->sum('weight'),
            'total_income' => $totals['total_income'],
            'total_expenses' => $totals['total_expenses'],
            'profit' => $totals['total_income'] - $totals['total_expenses'],
            'fuel_consumed' => $totals['fuel'],
            'active_trucks' => Truck::where('status', 'active')->count(),
            'active_drivers' => Driver::where('status', 'active')->count(),
        ]);

        // ============ CONFIGURACIÓN ============
        Setting::updateOrCreate(['key' => 'company'], [
            'value' => json_encode([
                'name' => 'Caliza Los Osos',
                'rfc' => '1556778-1-2015',
                'address' => 'Corregimiento El Coco, Distrito de Penonomé, Coclé, Panamá',
                'phone' => '+(507) 900-0000',
                'email' => 'hola@calizalosos.com',
            ]),
            'group' => 'general',
        ]);

        Setting::updateOrCreate(['key' => 'tax'], [
            'value' => json_encode(['iva_rate' => 0.07]),
            'group' => 'tax',
        ]);

        Setting::updateOrCreate(['key' => 'fuel'], [
            'value' => json_encode(['price_per_liter' => 1.10]),
            'group' => 'fuel',
        ]);

        Setting::updateOrCreate(['key' => 'ai'], [
            'value' => json_encode([
                'enabled' => true,
                'maintenance_prediction' => true,
                'route_optimization' => true,
            ]),
            'group' => 'ai',
        ]);

        // ============ ALERTAS DE EJEMPLO ============
        Alert::create([
            'type' => 'inventory',
            'severity' => 'medium',
            'title' => 'Stock bajo de Arena',
            'message' => 'El inventario de Arena de Río está por debajo del mínimo (450 de 600 ton).',
            'entity_id' => $invArena->id,
            'entity_type' => 'inventory',
        ]);

        Alert::create([
            'type' => 'license',
            'severity' => 'high',
            'title' => 'Licencia por vencer',
            'message' => 'La licencia de Jorge Ramírez vence el 2026-12-01.',
            'entity_id' => $driver2->id,
            'entity_type' => 'driver',
        ]);

        Alert::create([
            'type' => 'maintenance',
            'severity' => 'medium',
            'title' => 'Mantenimiento próximo',
            'message' => 'El camión ABC-1234 requiere mantenimiento a los 190,000 km.',
            'entity_id' => $truck1->id,
            'entity_type' => 'truck',
        ]);

        // ============ MENSAJERÍA WHATSAPP (secretaria) ============
        $secretaria = User::where('email', 'secretaria@calizalosos.com')->first();
        $conversations = [
            [
                'contact_name' => 'Cemento Panamá',
                'contact_phone' => '+507 6000-0001',
                'status' => 'active',
                'unread_count' => 2,
                'messages' => [
                    ['direction' => 'incoming', 'content' => 'Buenos días, ¿tienen disponible caliza para mañana por la mañana?'],
                    ['direction' => 'outgoing', 'content' => 'Buenos días, sí. ¿Qué cantidad necesitan y a qué punto la entregan?'],
                    ['direction' => 'incoming', 'content' => 'Unas 40 toneladas hacia la planta de producción.'],
                ],
            ],
            [
                'contact_name' => 'Constructora del Istmo',
                'contact_phone' => '+507 6000-0002',
                'status' => 'new',
                'unread_count' => 1,
                'messages' => [
                    ['direction' => 'incoming', 'content' => 'Hola, necesito el estado de la factura FAC-2026-002.'],
                ],
            ],
            [
                'contact_name' => 'Estación de Combustible Penonomé',
                'contact_phone' => '+507 6000-0003',
                'status' => 'closed',
                'unread_count' => 0,
                'messages' => [
                    ['direction' => 'incoming', 'content' => 'Confirmamos el envío del combustible de la semana.'],
                    ['direction' => 'outgoing', 'content' => 'Gracias, lo recibimos a tiempo.'],
                ],
            ],
        ];

        foreach ($conversations as $c) {
            $conversation = \App\Models\WhatsAppConversation::create([
                'contact_name' => $c['contact_name'],
                'contact_phone' => $c['contact_phone'],
                'status' => $c['status'],
                'unread_count' => $c['unread_count'],
                'assigned_to' => $secretaria?->id,
                'last_message_at' => now()->subHours(2),
            ]);

            $at = now()->subHours(3);
            foreach ($c['messages'] as $m) {
                $at = $at->addMinutes(15);
                \App\Models\WhatsAppMessage::create([
                    'conversation_id' => $conversation->id,
                    'direction' => $m['direction'],
                    'content' => $m['content'],
                    'message_at' => $at,
                    'sent_by' => $m['direction'] === 'outgoing' ? $secretaria?->id : null,
                ]);
            }
        }

        // ============ WORKSPACE DE LA SECRETARIA ============
        $secretariaId = $secretaria?->id;

        \App\Models\SecretaryAgenda::create([
            'title' => 'Reunión de producción semanal',
            'event_type' => 'reunion',
            'mode' => 'presencial',
            'starts_at' => now()->tomorrow()->setTime(9, 0),
            'ends_at' => now()->tomorrow()->setTime(10, 0),
            'participants' => 'Gerente de operaciones, Jefe de cantera, Supervisores',
            'location' => 'Sala de juntas principal',
            'notes' => 'Revisar avance de producción y agenda de despachos.',
            'status' => 'confirmada',
            'created_by' => $secretariaId,
        ]);

        \App\Models\SecretaryAgenda::create([
            'title' => 'Cita con proveedor de insumos',
            'event_type' => 'cita',
            'mode' => 'virtual',
            'starts_at' => now()->tomorrow()->setTime(14, 0),
            'ends_at' => now()->tomorrow()->setTime(14, 30),
            'participants' => 'Representante de Insumos Panamá',
            'location' => 'Videollamada (Teams)',
            'notes' => 'Cotización de suministros de oficina para el mes.',
            'status' => 'pendiente',
            'created_by' => $secretariaId,
        ]);

        \App\Models\SecretaryReception::create([
            'type' => 'visita',
            'person_name' => 'Roberto Gutiérrez',
            'company' => 'Constructora del Istmo',
            'phone' => '+507 6000-0002',
            'subject' => 'Entrega de documentación de facturas',
            'notes' => 'Trae factura FAC-2026-002 para revisión.',
            'status' => 'canalizado',
            'attended_at' => now()->subHours(2),
            'created_by' => $secretariaId,
        ]);

        \App\Models\SecretaryReception::create([
            'type' => 'llamada',
            'person_name' => 'María López',
            'company' => 'Cemento Panamá',
            'phone' => '+507 6000-0001',
            'subject' => 'Consulta de disponibilidad de caliza',
            'notes' => 'Confirmar con despacho si hay 40 toneladas disponibles.',
            'status' => 'canalizado',
            'attended_at' => now()->subHours(1),
            'created_by' => $secretariaId,
        ]);

        \App\Models\SecretaryDocument::create([
            'title' => 'Contrato de transporte anual',
            'category' => 'Contratos',
            'format' => 'fisico',
            'location' => 'Archivo principal, carpeta 03',
            'notes' => 'Vigencia 2026.',
            'created_by' => $secretariaId,
        ]);

        \App\Models\SecretaryDocument::create([
            'title' => 'Facturas del mes de julio',
            'category' => 'Facturación',
            'format' => 'digital',
            'location' => 'Nube / Facturas / 2026',
            'notes' => 'Respaldo en PDF.',
            'created_by' => $secretariaId,
        ]);

        \App\Models\SecretaryLogistic::create([
            'type' => 'sala',
            'title' => 'Preparar sala de juntas para reunión semanal',
            'details' => 'Disponer proyector, agua y material de apoyo.',
            'date' => now()->tomorrow()->setTime(8, 30),
            'status' => 'pendiente',
            'created_by' => $secretariaId,
        ]);

        \App\Models\SecretaryLogistic::create([
            'type' => 'suministro',
            'title' => 'Compra de suministros de oficina',
            'details' => 'Resmas de papel, bolígrafos, folders y tinta de impresora.',
            'date' => now()->addDays(2)->setTime(10, 0),
            'status' => 'pendiente',
            'created_by' => $secretariaId,
        ]);

        $this->command->info('Base de datos sembrada correctamente.');
        $this->command->info('Admin: admin@calizalosos.com / password123');

        // ============ WORKSPACE DEL SUPERVISOR DE PLANTA ============
        $supervisor = User::where('email', 'supervisor@calizalosos.com')->first();
        $supervisorId = $supervisor?->id;

        \App\Models\SupervisorPlanning::create([
            'title' => 'Extracción matutina en cantera norte',
            'activity_type' => 'extraccion',
            'planned_date' => now()->toDateString(),
            'start_time' => '07:00',
            'end_time' => '12:00',
            'area' => 'Cantera norte',
            'assigned_person' => 'Equipo de extracción',
            'notes' => 'Verificar condiciones del frente de arranque.',
            'status' => 'en_proceso',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorPlanning::create([
            'title' => 'Chancado secundario de caliza',
            'activity_type' => 'chancado',
            'planned_date' => now()->toDateString(),
            'start_time' => '13:00',
            'end_time' => '17:00',
            'area' => 'Planta de trituración',
            'assigned_person' => 'Operador de chancadora',
            'notes' => 'Controlar granulometría de salida.',
            'status' => 'planificado',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorReception::create([
            'stage' => 'recepcion',
            'material' => 'Caliza cruda',
            'tonnage' => 320.5,
            'processed_date' => now()->toDateString(),
            'origin' => 'Cantera norte',
            'notes' => 'Recepción en báscula de planta.',
            'status' => 'completado',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorReception::create([
            'stage' => 'chancado_primario',
            'material' => 'Caliza chancada 0-10 cm',
            'tonnage' => 285.0,
            'processed_date' => now()->toDateString(),
            'origin' => 'Chancadora primaria',
            'notes' => 'Abastecimiento continuo asegurado.',
            'status' => 'en_proceso',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorBlending::create([
            'title' => 'Mezcla para cemento portland',
            'materials' => 'Caliza, arcilla y arena',
            'target_spec' => 76.5,
            'blend_date' => now()->toDateString(),
            'notes' => 'Cumplir especificación de CaO del producto final.',
            'status' => 'en_proceso',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorBlending::create([
            'title' => 'Mezcla para cal agrícola',
            'materials' => 'Caliza micronizada',
            'target_spec' => 90.0,
            'blend_date' => now()->addDay()->toDateString(),
            'notes' => 'Revisar pureza antes de molienda.',
            'status' => 'planificado',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorQuality::create([
            'material' => 'Caliza agrícola',
            'purity' => 92.4,
            'granulometry' => '0-2 mm',
            'industry' => 'agricultura',
            'checked_date' => now()->toDateString(),
            'notes' => 'Parámetros dentro de especificación.',
            'status' => 'cumple',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorQuality::create([
            'material' => 'Caliza construcción',
            'purity' => 88.1,
            'granulometry' => '2-5 mm',
            'industry' => 'construccion',
            'checked_date' => now()->toDateString(),
            'notes' => 'Granulometría ligeramente gruesa, programar re-molienda.',
            'status' => 'no_cumple',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorSafety::create([
            'type' => 'protocolo_epp',
            'title' => 'Verificación de EPP en área de chancado',
            'description' => 'Revisar uso de casco, protectores auditivos y respiradores.',
            'risk_level' => 'medio',
            'status' => 'verificado',
            'checked_date' => now()->toDateString(),
            'action_plan' => 'Reponer respiradores del turno de tarde.',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorSafety::create([
            'type' => 'control_riesgo',
            'title' => 'Control de polución en planta',
            'description' => 'Alta concentración de polvo en zona de recepción.',
            'risk_level' => 'alto',
            'status' => 'en_atencion',
            'checked_date' => now()->toDateString(),
            'action_plan' => 'Activar sistema de aspersión y evaluar ventilación.',
            'created_by' => $supervisorId,
        ]);

        \App\Models\SupervisorTask::create([
            'title' => 'Inspección de chancadora secundaria',
            'assignee' => 'Técnico de planta',
            'priority' => 'alta',
            'due_date' => now()->addDay()->toDateString(),
            'notes' => 'Revisar mandíbulas y sistema de lubricación.',
            'status' => 'en_proceso',
            'assigned_by' => $supervisorId,
        ]);

        \App\Models\SupervisorTask::create([
            'title' => 'Capacitación IPERC al personal de cantera',
            'assignee' => 'Todo el personal operativo',
            'priority' => 'media',
            'due_date' => now()->addDays(3)->toDateString(),
            'notes' => 'Inducción de riesgos en operaciones de extracción.',
            'status' => 'pendiente',
            'assigned_by' => $supervisorId,
        ]);

        $this->command->info('Base de datos sembrada correctamente.');
        $this->command->info('Admin: admin@calizalosos.com / password123');

        // ============ WORKSPACE DEL CONTADOR DE COSTOS ============
        $contador = User::where('email', 'contabilidad@calizalosos.com')->first();
        $contadorId = $contador?->id;

        \App\Models\AccountantCost::create([
            'category' => 'electricidad',
            'description' => 'Consumo eléctrico planta de trituración',
            'amount' => 8500.00,
            'tonnage' => 320.5,
            'cost_date' => now()->toDateString(),
            'status' => 'verificado',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantCost::create([
            'category' => 'combustible',
            'description' => 'Combustible hornos caleros',
            'amount' => 12400.00,
            'tonnage' => 300,
            'cost_date' => now()->toDateString(),
            'status' => 'verificado',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantCost::create([
            'category' => 'explosivos',
            'description' => 'Explosivos para voladura en cantera',
            'amount' => 3600.00,
            'tonnage' => 280,
            'cost_date' => now()->toDateString(),
            'status' => 'registrado',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantAsset::create([
            'name' => 'Chancadora primaria 500 HP',
            'type' => 'maquinaria',
            'acquisition_value' => 850000.00,
            'acquisition_date' => now()->subYears(3)->toDateString(),
            'useful_life_years' => 10,
            'salvage_value' => 50000.00,
            'accumulated_depreciation' => 240000.00,
            'status' => 'activo',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantAsset::create([
            'name' => 'Horno calero rotativo',
            'type' => 'horno_calero',
            'acquisition_value' => 1200000.00,
            'acquisition_date' => now()->subYears(2)->toDateString(),
            'useful_life_years' => 15,
            'salvage_value' => 80000.00,
            'accumulated_depreciation' => 160000.00,
            'status' => 'activo',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantAsset::create([
            'name' => 'Concesión minera Los Osos',
            'type' => 'concesion_minera',
            'acquisition_value' => 500000.00,
            'acquisition_date' => now()->subYears(5)->toDateString(),
            'useful_life_years' => 20,
            'salvage_value' => 0,
            'accumulated_depreciation' => 125000.00,
            'status' => 'activo',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantBudget::create([
            'title' => 'Presupuesto OPEX mensual producción',
            'budget_type' => 'opex',
            'category' => 'proceso',
            'planned_amount' => 45000.00,
            'actual_amount' => 42800.00,
            'period' => date('Y-m'),
            'status' => 'aprobado',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantBudget::create([
            'title' => 'CAPEX: renovación flota de volquetes',
            'budget_type' => 'capex',
            'category' => 'proyecto',
            'planned_amount' => 200000.00,
            'actual_amount' => 0,
            'period' => date('Y'),
            'status' => 'borrador',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantCompliance::create([
            'type' => 'impuesto_extractivo',
            'title' => 'Cánon superficialario concesión minera',
            'amount' => 12500.00,
            'due_date' => now()->addDays(45)->toDateString(),
            'status' => 'pendiente',
            'created_by' => $contadorId,
        ]);

        \App\Models\AccountantCompliance::create([
            'type' => 'provision_cierre_mina',
            'title' => 'Provisión cierre de mina y mitigación ambiental',
            'amount' => 75000.00,
            'due_date' => now()->addMonths(6)->toDateString(),
            'status' => 'provisionado',
            'created_by' => $contadorId,
        ]);

        $this->command->info('Base de datos sembrada correctamente.');
        $this->command->info('Admin: admin@calizalosos.com / password123');
    }
}
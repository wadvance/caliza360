<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
use Kreait\Laravel\Firebase\FirebaseMessaging;
use Illuminate\Support\Facades\Log;

class FirebaseService
{
    protected $factory;
    protected $database;
    protected bool $configured = false;

    public function __construct()
    {
        $serviceAccount = config('firebase.service_account');
        if (!$serviceAccount) {
            $this->configured = false;
            return;
        }

        try {
            $this->factory = (new Factory)
                ->withServiceAccount($serviceAccount)
                ->withDatabaseUri(config('firebase.database_url'));

            $this->database = $this->factory->createDatabase();
            $this->configured = true;
        } catch (\Exception $e) {
            $this->configured = false;
            Log::warning('Firebase not configured: ' . $e->getMessage());
        }
    }

    public function isConfigured(): bool
    {
        return $this->configured;
    }

    public function getDatabase()
    {
        return $this->database;
    }

    public function getMessaging()
    {
        return $this->factory->createMessaging();
    }

    // ============ USERS ============

    public function createUser(array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('users/' . $data['id'])->set($data);
    }

    public function getUser($userId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('users/' . $userId)->getValue();
    }

    public function updateUser($userId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('users/' . $userId)->update($data);
    }

    public function deleteUser($userId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('users/' . $userId)->remove();
    }

    public function getAllUsers()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('users')->getValue() ?? [];
    }

    // ============ TRUCKS ============

    public function createTruck(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('truck_');
        $data['id'] = $id;
        $this->database->getReference('trucks/' . $id)->set($data);
        return $data;
    }

    public function getTruck($truckId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('trucks/' . $truckId)->getValue();
    }

    public function updateTruck($truckId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('trucks/' . $truckId)->update($data);
    }

    public function deleteTruck($truckId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('trucks/' . $truckId)->remove();
    }

    public function getAllTrucks()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('trucks')->getValue() ?? [];
    }

    // ============ DRIVERS ============

    public function createDriver(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('driver_');
        $data['id'] = $id;
        $this->database->getReference('drivers/' . $id)->set($data);
        return $data;
    }

    public function getDriver($driverId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('drivers/' . $driverId)->getValue();
    }

    public function updateDriver($driverId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('drivers/' . $driverId)->update($data);
    }

    public function deleteDriver($driverId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('drivers/' . $driverId)->remove();
    }

    public function getAllDrivers()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('drivers')->getValue() ?? [];
    }

    // ============ TRIPS ============

    public function createTrip(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('trip_');
        $data['id'] = $id;
        $this->database->getReference('trips/' . $id)->set($data);
        return $data;
    }

    public function getTrip($tripId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('trips/' . $tripId)->getValue();
    }

    public function updateTrip($tripId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('trips/' . $tripId)->update($data);
    }

    public function deleteTrip($tripId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('trips/' . $tripId)->remove();
    }

    public function getAllTrips()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('trips')->getValue() ?? [];
    }

    public function getTripsByDriver($driverId)
    {
        if (!$this->configured) return [];
        return $this->database->getReference('trips')
            ->orderByChild('driverId')
            ->equalTo($driverId)
            ->getValue() ?? [];
    }

    public function getTripsByDate($date)
    {
        if (!$this->configured) return [];
        return $this->database->getReference('trips')
            ->orderByChild('scheduledDate')
            ->equalTo($date)
            ->getValue() ?? [];
    }

    // ============ CLIENTS ============

    public function createClient(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('client_');
        $data['id'] = $id;
        $this->database->getReference('clients/' . $id)->set($data);
        return $data;
    }

    public function getClient($clientId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('clients/' . $clientId)->getValue();
    }

    public function updateClient($clientId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('clients/' . $clientId)->update($data);
    }

    public function deleteClient($clientId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('clients/' . $clientId)->remove();
    }

    public function getAllClients()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('clients')->getValue() ?? [];
    }

    // ============ SUPPLIERS ============

    public function createSupplier(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('supplier_');
        $data['id'] = $id;
        $this->database->getReference('suppliers/' . $id)->set($data);
        return $data;
    }

    public function getSupplier($supplierId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('suppliers/' . $supplierId)->getValue();
    }

    public function updateSupplier($supplierId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('suppliers/' . $supplierId)->update($data);
    }

    public function deleteSupplier($supplierId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('suppliers/' . $supplierId)->remove();
    }

    public function getAllSuppliers()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('suppliers')->getValue() ?? [];
    }

    // ============ INVENTORY ============

    public function createInventory(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('inventory_');
        $data['id'] = $id;
        $this->database->getReference('inventory/' . $id)->set($data);
        return $data;
    }

    public function getInventory($inventoryId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('inventory/' . $inventoryId)->getValue();
    }

    public function updateInventory($inventoryId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('inventory/' . $inventoryId)->update($data);
    }

    public function deleteInventory($inventoryId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('inventory/' . $inventoryId)->remove();
    }

    public function getAllInventory()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('inventory')->getValue() ?? [];
    }

    public function addInventoryMovement($inventoryId, array $movement)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('inventory/' . $inventoryId . '/movements')->push($movement);
    }

    // ============ INVOICES ============

    public function createInvoice(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('invoice_');
        $data['id'] = $id;
        $this->database->getReference('invoices/' . $id)->set($data);
        return $data;
    }

    public function getInvoice($invoiceId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('invoices/' . $invoiceId)->getValue();
    }

    public function updateInvoice($invoiceId, array $data)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('invoices/' . $invoiceId)->update($data);
    }

    public function deleteInvoice($invoiceId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('invoices/' . $invoiceId)->remove();
    }

    public function getAllInvoices()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('invoices')->getValue() ?? [];
    }

    // ============ DAILY METRICS ============

    public function updateDailyMetrics($date, array $metrics)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('dailyMetrics/' . $date)->set($metrics);
    }

    public function getDailyMetrics($date)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('dailyMetrics/' . $date)->getValue();
    }

    public function getWeeklyMetrics($startDate, $endDate)
    {
        if (!$this->configured) return [];
        return $this->database->getReference('dailyMetrics')
            ->orderByKey()
            ->startAt($startDate)
            ->endAt($endDate)
            ->getValue() ?? [];
    }

    // ============ ALERTS ============

    public function createAlert(array $data)
    {
        if (!$this->configured) return null;
        $id = $data['id'] ?? uniqid('alert_');
        $data['id'] = $id;
        $this->database->getReference('alerts/' . $id)->set($data);
        return $data;
    }

    public function getAlerts($type = null)
    {
        if (!$this->configured) return [];
        $ref = $this->database->getReference('alerts');
        if ($type) {
            $ref = $ref->orderByChild('type')->equalTo($type);
        }
        return $ref->getValue() ?? [];
    }

    public function markAlertAsRead($alertId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('alerts/' . $alertId)->update(['isRead' => true]);
    }

    public function deleteAlert($alertId)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('alerts/' . $alertId)->remove();
    }

    // ============ SETTINGS ============

    public function getSettings()
    {
        if (!$this->configured) return [];
        return $this->database->getReference('settings')->getValue() ?? [];
    }

    public function updateSettings(array $settings)
    {
        if (!$this->configured) return null;
        return $this->database->getReference('settings')->set($settings);
    }
}

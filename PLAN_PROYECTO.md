# 🏗️ SISTEMA INTEGRAL DE GESTIÓN PARA CALIZA LOS OSOS

## 📋 RESUMEN EJECUTIVO

Sistema completo de gestión para empresa de transporte de caliza que incluye:
- **App Móvil Flutter** (Android/iOS) para conductores y administración
- **Panel Web React** para administradores y oficina
- **Backend Laravel** con API RESTful
- **Firebase Firestore** como base de datos principal
- **IA Básica** para predicción de mantenimiento y reportes automáticos

---

## 🛠️ STACK TECNOLÓGICO

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Frontend Web | React 18 + Vite | Panel administrativo |
| UI Web | Tailwind CSS + Shadcn/UI | Diseño responsivo |
| App Móvil | Flutter 3.x | iOS y Android |
| Backend | Laravel 10+ (PHP 8.2+) | API RESTful |
| Base de Datos | Firebase Firestore | Datos en tiempo real |
| Autenticación | Laravel Sanctum + Firebase Auth | JWT tokens |
| Almacenamiento | Firebase Storage | Fotos, documentos, firmas |
| Mapas | Google Maps API | Rutas y geolocalización |
| IA | Python + scikit-learn / TensorFlow Lite | Predicciones básicas |
| Notificaciones | Firebase Cloud Messaging | Push notifications |
| Hosting | Firebase Hosting / Vercel | Despliegue web |

---

## 📁 ESTRUCTURA DEL PROYECTO (MONOREPO)

```
caliza-los-osos/
├── 📱 apps/
│   ├── 📲 mobile/                    # Flutter App
│   │   ├── lib/
│   │   │   ├── main.dart
│   │   │   ├── app/
│   │   │   │   ├── routes.dart
│   │   │   │   └── theme.dart
│   │   │   ├── config/
│   │   │   │   ├── firebase_config.dart
│   │   │   │   └── api_config.dart
│   │   │   ├── models/
│   │   │   │   ├── user.dart
│   │   │   │   ├── truck.dart
│   │   │   │   ├── driver.dart
│   │   │   │   ├── trip.dart
│   │   │   │   ├── client.dart
│   │   │   │   ├── supplier.dart
│   │   │   │   ├── inventory.dart
│   │   │   │   └── invoice.dart
│   │   │   ├── screens/
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── trucks/
│   │   │   │   ├── drivers/
│   │   │   │   ├── trips/
│   │   │   │   ├── clients/
│   │   │   │   ├── inventory/
│   │   │   │   ├── billing/
│   │   │   │   └── reports/
│   │   │   ├── widgets/
│   │   │   ├── services/
│   │   │   │   ├── api_service.dart
│   │   │   │   ├── firebase_service.dart
│   │   │   │   └── auth_service.dart
│   │   │   └── providers/
│   │   ├── android/
│   │   ├── ios/
│   │   └── pubspec.yaml
│   │
│   └── 🖥️ web/                       # React Admin Panel
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── config/
│       │   ├── components/
│       │   ├── pages/
│       │   │   ├── Dashboard/
│       │   │   ├── Trucks/
│       │   │   ├── Drivers/
│       │   │   ├── Trips/
│       │   │   ├── Clients/
│       │   │   ├── Suppliers/
│       │   │   ├── Inventory/
│       │   │   ├── Billing/
│       │   │   ├── Accounting/
│       │   │   ├── Reports/
│       │   │   └── Settings/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── store/                 # Redux/Zustand
│       │   ├── types/
│       │   └── utils/
│       ├── package.json
│       └── vite.config.ts
│
├── 🔧 backend/                       # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── TruckController.php
│   │   │   │   ├── DriverController.php
│   │   │   │   ├── TripController.php
│   │   │   │   ├── ClientController.php
│   │   │   │   ├── SupplierController.php
│   │   │   │   ├── InventoryController.php
│   │   │   │   ├── InvoiceController.php
│   │   │   │   ├── ReportController.php
│   │   │   │   └── AIController.php
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   └── Services/
│   │       ├── FirebaseService.php
│   │       ├── AIService.php
│   │       └── ReportService.php
│   ├── routes/
│   │   └── api.php
│   ├── config/
│   └── composer.json
│
├── 🤖 ai-service/                    # Servicio de IA (Python)
│   ├── models/
│   ├── api/
│   ├── predictions/
│   │   ├── maintenance_predictor.py
│   │   ├── route_optimizer.py
│   │   └── report_generator.py
│   ├── requirements.txt
│   └── main.py
│
├── 📦 shared/                        # Tipos y modelos compartidos
│   ├── types/
│   └── constants/
│
└── 📄 docs/
    ├── api/
    ├── database/
    └── deployment/
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS (FIRESTORE)

### Colecciones Principales

```javascript
// ============ AUTENTICACIÓN Y USUARIOS ============
users/{userId} {
  id: string,
  email: string,
  name: string,
  role: 'admin' | 'dispatcher' | 'driver' | 'accountant',
  phone: string,
  avatar: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// ============ DASHBOARD Y MÉTRICAS ============
dailyMetrics/{date} {
  date: string, // "2026-08-01"
  totalTrips: number,
  totalTonsTransported: number,
  totalIncome: number,
  totalExpenses: number,
  profit: number,
  fuelConsumed: number,
  activeTrucks: number,
  activeDrivers: number,
  updatedAt: timestamp
}

// ============ CAMIONES ============
trucks/{truckId} {
  id: string,
  plate: string,           // "ABC-1234"
  brand: string,           // "Kenworth"
  model: string,           // "T800"
  year: number,
  color: string,
  vinNumber: string,       // Número de serie
  engineType: string,      // "Diésel"
  capacity: number,        // Toneladas máximas
  currentMileage: number,  // Kilometraje actual
  status: 'active' | 'maintenance' | 'inactive',
  insurance: {
    provider: string,
    policyNumber: string,
    startDate: date,
    endDate: date,
    cost: number
  },
  circulationCard: {
    number: string,
    expiryDate: date
  },
  photos: string[],        // URLs de fotos
  createdAt: timestamp,
  updatedAt: timestamp
}

// Subcolección: Mantenimiento
trucks/{truckId}/maintenance/{maintenanceId} {
  id: string,
  type: 'preventive' | 'corrective' | 'emergency',
  description: string,
  cost: number,
  mileageAtService: number,
  nextServiceMileage: number,
  serviceDate: date,
  mechanic: string,
  workshop: string,
  parts: [{
    name: string,
    cost: number,
    brand: string
  }],
  invoiceNumber: string,
  status: 'scheduled' | 'in_progress' | 'completed',
  createdAt: timestamp
}

// Subcolección: Llantas
trucks/{truckId}/tires/{tireId} {
  id: string,
  position: string,        // "Delantera Izquierda"
  brand: string,
  model: string,
  serialNumber: string,
  installDate: date,
  currentMileage: number,
  maxMileage: number,      // Vida útil
  pressure: number,
  status: 'good' | 'worn' | 'needs_replacement',
  createdAt: timestamp
}

// ============ CONDUCTORES ============
drivers/{driverId} {
  id: string,
  userId: string,          // Referencia a users
  name: string,
  license: {
    number: string,
    type: string,          // "A", "B", "C"
    expiryDate: date,
    issuedBy: string
  },
  curp: string,
  rfc: string,
  phone: string,
  emergencyContact: {
    name: string,
    phone: string,
    relationship: string
  },
  address: string,
  hireDate: date,
  status: 'active' | 'inactive' | 'on_trip',
  currentTruckId: string,
  totalTrips: number,
  totalHoursWorked: number,
  rating: number,          // 1-5
  photo: string,
  documents: [{
    type: string,
    url: string,
    expiryDate: date
  }],
  createdAt: timestamp,
  updatedAt: timestamp
}

// Subcolección: Horas trabajadas
drivers/{driverId}/workHours/{hoursId} {
  id: string,
  date: date,
  startTime: timestamp,
  endTime: timestamp,
  totalHours: number,
  tripId: string,
  status: 'active' | 'completed',
  createdAt: timestamp
}

// ============ CLIENTES ============
clients/{clientId} {
  id: string,
  name: string,
  company: string,
  rfc: string,
  email: string,
  phone: string,
  address: {
    street: string,
    number: string,
    colony: string,
    city: string,
    state: string,
    zipCode: string
  },
  contactPerson: string,
  paymentTerms: string,    // "30 días", "Contado"
  creditLimit: number,
  currentBalance: number,
  totalPurchases: number,
  totalTonsPurchased: number,
  rating: number,
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Subcolección: Historial de compras
clients/{clientId}/purchases/{purchaseId} {
  id: string,
  tripId: string,
  date: date,
  materialType: string,    // "Caliza", "Arena", "Grava"
  tons: number,
  pricePerTon: number,
  totalAmount: number,
  invoiceNumber: string,
  status: 'pending' | 'paid' | 'overdue',
  paymentDate: date,
  createdAt: timestamp
}

// ============ PROVEEDORES ============
suppliers/{supplierId} {
  id: string,
  name: string,
  company: string,
  rfc: string,
  email: string,
  phone: string,
  address: string,
  category: string,        // "Combustible", "Llantas", "Refacciones"
  paymentTerms: string,
  totalPurchases: number,
  outstandingBalance: number,
  rating: number,
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Subcolección: Historial de compras
suppliers/{supplierId}/purchases/{purchaseId} {
  id: string,
  date: date,
  description: string,
  amount: number,
  invoiceNumber: string,
  paymentMethod: string,
  status: 'pending' | 'paid',
  createdAt: timestamp
}

// ============ VIAJES ============
trips/{tripId} {
  id: string,
  driverId: string,
  truckId: string,
  clientId: string,
  
  // Origen y Destino
  origin: {
    name: string,
    address: string,
    lat: number,
    lng: number,
    quarry: string         // Nombre de la cantera
  },
  destination: {
    name: string,
    address: string,
    lat: number,
    lng: number,
    client: string
  },
  
  // Material
  materialType: string,    // "Caliza", "Arena", "Grava"
  weight: number,          // Toneladas
  pricePerTon: number,
  totalAmount: number,
  
  // Fechas y Horas
  scheduledDate: date,
  scheduledTime: time,
  departureTime: timestamp,
  arrivalTime: timestamp,
  returnTime: timestamp,
  
  // Estado
  status: 'scheduled' | 'in_transit' | 'delivered' | 'returned' | 'cancelled',
  
  // Kilometraje
  startMileage: number,
  endMileage: number,
  distance: number,        // km
  
  // Combustible
  fuelStart: number,
  fuelEnd: number,
  fuelConsumed: number,
  
  // Documentos
  photos: [{
    url: string,
    type: string,          // "departure", "delivery", "return"
    timestamp: timestamp
  }],
  customerSignature: string, // URL de firma
  deliveryProof: string,
  notes: string,
  
  // Costos
  costs: {
    fuel: number,
    tolls: number,
    maintenance: number,
    other: number
  },
  
  // IA
  aiOptimizedRoute: boolean,
  estimatedDuration: number,
  actualDuration: number,
  
  createdAt: timestamp,
  updatedAt: timestamp
}

// ============ INVENTARIO DE CALIZA ============
inventory/{inventoryId} {
  id: string,
  materialType: string,    // "Caliza", "Arena", "Grava"
  location: string,        // "Bodega Principal", "Cantera Norte"
  currentStock: number,    // Toneladas
  minStock: number,        // Mínimo alerta
  maxStock: number,
  unitCost: number,
  lastEntry: date,
  lastExit: date,
  status: 'normal' | 'low' | 'critical',
  createdAt: timestamp,
  updatedAt: timestamp
}

// Subcolección: Movimientos
inventory/{inventoryId}/movements/{movementId} {
  id: string,
  type: 'entry' | 'exit',
  quantity: number,
  unitCost: number,
  totalCost: number,
  reference: string,       // "Viaje #123", "Compra #456"
  tripId: string,
  supplierId: string,
  date: date,
  notes: string,
  createdAt: timestamp
}

// ============ FACTURACIÓN ============
invoices/{invoiceId} {
  id: string,
  invoiceNumber: string,   // "FAC-2026-001"
  type: 'sale' | 'purchase',
  clientId: string,
  supplierId: string,
  
  items: [{
    description: string,
    quantity: number,
    unitPrice: number,
    total: number,
    materialType: string
  }],
  
  subtotal: number,
  iva: number,
  total: number,
  
  issueDate: date,
  dueDate: date,
  paymentDate: date,
  
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
  paymentMethod: string,
  
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// ============ CUENTAS POR COBRAR/PAGAR ============
accountsReceivable/{accountId} {
  id: string,
  clientId: string,
  invoiceId: string,
  amount: number,
  paidAmount: number,
  balance: number,
  dueDate: date,
  status: 'pending' | 'partial' | 'paid' | 'overdue',
  reminders: [{
    date: date,
    method: string,
    notes: string
  }],
  createdAt: timestamp,
  updatedAt: timestamp
}

accountsPayable/{accountId} {
  id: string,
  supplierId: string,
  invoiceId: string,
  amount: number,
  paidAmount: number,
  balance: number,
  dueDate: date,
  status: 'pending' | 'partial' | 'paid' | 'overdue',
  createdAt: timestamp,
  updatedAt: timestamp
}

// ============ NÓMINA ============
payroll/{payrollId} {
  id: string,
  driverId: string,
  period: string,          // "2026-07"
  startDate: date,
  endDate: date,
  
  baseSalary: number,
  overtimeHours: number,
  overtimeRate: number,
  overtimePay: number,
  bonuses: number,
  deductions: number,
  taxes: number,
  netPay: number,
  
  tripsCompleted: number,
  totalHoursWorked: number,
  
  status: 'draft' | 'approved' | 'paid',
  paymentDate: date,
  createdAt: timestamp,
  updatedAt: timestamp
}

// ============ ALERTAS Y NOTIFICACIONES ============
alerts/{alertId} {
  id: string,
  type: 'maintenance' | 'insurance' | 'license' | 'inventory' | 'payment',
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  message: string,
  entityId: string,        // ID del camión, conductor, etc.
  entityType: string,      // "truck", "driver", "invoice"
  isRead: boolean,
  createdAt: timestamp
}

// ============ CONFIGURACIÓN ============
settings/{settingId} {
  id: string,
  company: {
    name: string,
    rfc: string,
    address: string,
    phone: string,
    email: string
  },
  tax: {
    ivaRate: number       // 0.16
  },
  fuel: {
    pricePerLiter: number
  },
  ai: {
    enabled: boolean,
    maintenancePrediction: boolean,
    routeOptimization: boolean
  },
  updatedAt: timestamp
}
```

---

## 📱 MÓDULOS MVP (FASE 1)

### 1. 🔐 Autenticación y Roles
- Login con email/contraseña
- Roles: Admin, Dispatcher, Driver, Accountant
- Recuperación de contraseña
- Perfil de usuario

### 2. 📊 Dashboard Principal
- Resumen del día (viajes, toneladas, ingresos, gastos)
- Gráficas de producción semanal/mensual
- Alertas activas
- Mapa de viajes en curso

### 3. 🚛 Gestión de Camiones
- CRUD de camiones
- Registro de placas, marca, modelo, año
- Control de seguros y vigencias
- Control de llantas y desgaste
- Registro de kilometraje
- Historial de mantenimiento
- Próximos mantenimientos (IA)

### 4. 👷 Gestión de Conductores
- CRUD de conductores
- Documentos y licencias
- Horas trabajadas
- Asignación a camiones
- Historial de viajes

### 5. 🗺️ Gestión de Viajes
- Crear/programar viajes
- Origen y destino con mapa
- Tipo de material y peso
- Estado del viaje (programado → en tránsito → entregado → regresado)
- Tiempos de llegada y salida
- Fotos y firma del cliente
- Kilometraje y consumo de combustible

### 6. 📦 Inventario de Caliza
- Stock actual por material
- Entradas y salidas
- Alertas de stock mínimo
- Historial de movimientos

### 7. 💰 Facturación Básica
- Crear facturas de venta
- Cuentas por cobrar
- Registro de pagos
- Reporte de clientes morosos

---

## 📅 FASES DE DESARROLLO

### FASE 1: Fundamentos (Semanas 1-4)
| Semana | Tarea |
|--------|-------|
| 1-2 | Configurar proyecto Laravel, Firebase, estructura base |
| 3-4 | Autenticación, usuarios, roles, primeros endpoints |

### FASE 2: Core Operations (Semanas 5-10)
| Semana | Tarea |
|--------|-------|
| 5-6 | Módulo de camiones y mantenimiento |
| 7-8 | Módulo de conductores y horas |
| 9-10 | Módulo de viajes y geolocalización |

### FASE 3: Inventario y Facturación (Semanas 11-14)
| Semana | Tarea |
|--------|-------|
| 11-12 | Inventario de caliza |
| 13-14 | Facturación y cuentas por cobrar |

### FASE 4: App Móvil (Semanas 15-20)
| Semana | Tarea |
|--------|-------|
| 15-16 | Flutter setup, autenticación, navegación |
| 17-18 | Pantallas de conductor (viajes, fotos, firma) |
| 19-20 | Dashboard móvil, sincronización offline |

### FASE 5: Panel Web React (Semanas 21-26)
| Semana | Tarea |
|--------|-------|
| 21-22 | Setup React, dashboard, navegación |
| 23-24 | Módulos CRUD (camiones, conductores, clientes) |
| 25-26 | Reportes, gráficas, estadísticas |

### FASE 6: IA y Reportes (Semanas 27-30)
| Semana | Tarea |
|--------|-------|
| 27-28 | Predicción de mantenimiento con IA |
| 29-30 | Reportes automáticos, optimización de rutas |

### FASE 7: Pruebas y Despliegue (Semanas 31-34)
| Semana | Tarea |
|--------|-------|
| 31-32 | Pruebas completas, corrección de bugs |
| 33-34 | Despliegue producción, capacitación |

---

## 🧠 INTELIGENCIA ARTIFICIAL (BÁSICA)

### 1. Predicción de Mantenimiento
```python
# Basado en kilometraje y historial
def predict_next_maintenance(truck_id):
    truck = get_truck(truck_id)
    history = get_maintenance_history(truck_id)
    
    # Promedio de km entre mantenimientos
    avg_km_between = calculate_average_km(history)
    
    # Predicción simple
    next_service_km = truck.current_mileage + avg_km_between
    km_until_service = next_service_km - truck.current_mileage
    
    # Alerta si está cerca
    if km_until_service < 500:  # 500 km de alerta
        return {
            "alert": True,
            "message": f"Mantenimiento sugerido en {km_until_service:.0f} km",
            "severity": "high" if km_until_service < 200 else "medium"
        }
```

### 2. Optimización de Rutas (Básica)
- Cálculo de distancia más corta
- Evitar tráfico en horas pico
- Estimación de tiempo de viaje

### 3. Reportes Automáticos
- Resumen diario por email
- Alertas de inventario bajo
- Vencimiento de documentos

---

## 🔑 CREDENCIALES DE PRUEBA

```
Admin: admin@calizalosos.com / password123
Driver: conductor@calizalosos.com / password123
```

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ Tiempo de carga < 3 segundos
- ✅ Sincronización offline en app móvil
- ✅ 99.9% uptime
- ✅ Soporte para 50+ usuarios simultáneos
- ✅ Reducción del 30% en costos de mantenimiento (con IA)
- ✅ Ahorro del 15% en consumo de combustible (con optimización)

---

**Proyecto:** Sistema Integral de Gestión para Caliza Los Osos
**Versión:** 1.0.0
**Fecha:** Agosto 2026
**Desarrollado con:** Laravel + Flutter + React + Firebase + IA

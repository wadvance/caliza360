# 🔥 Guía de Configuración de Firebase — Caliza Los Osos

## Estado Actual

El proyecto Firebase `caliza360` **ya existe**. El `GoogleService-Info.plist` ya tiene credenciales reales.

| Dato | Valor |
|---|---|
| **Project ID** | `caliza360` |
| **API Key** | `AIzaSyAfcinHAhD075EwXkMvB66WbXhFdgsGbw8` |
| **Sender ID** | `321221946315` |
| **Storage Bucket** | `caliza360.firebasestorage.app` |
| **iOS App ID** | `1:321221946315:ios:1e6c40ab8b0887310ca44e` |
| **iOS Bundle ID** | `com.calizalosos.mobile` |

---

## Paso 1: Verificar/Completar Proyecto en Firebase Console

Ve a [https://console.firebase.google.com](https://console.firebase.google.com) y selecciona el proyecto `caliza360`.

### 1.1 Verificar que Authentication está habilitado
1. En el menú lateral, ve a **Authentication**
2. Haz clic en **"Comenzar"**
3. En la pestaña **Method**, habilita **Email/Contraseña**
4. Haz clic en **Guardar**

### 1.2 Verificar que Firestore está habilitado
1. En el menú lateral, ve a **Firestore Database**
2. Si no existe, haz clic en **"Crear base de datos"**
3. Selecciona **"Modo de prueba"**
4. Selecciona ubicación: **nam5 (Estados Unidos)** o la más cercana
5. Haz clic en **"Activar"**

### 1.3 Verificar que Storage está habilitado
1. En el menú lateral, ve a **Storage**
2. Si no existe, haz clic en **"Comenzar"**
3. Selecciona **"Modo de prueba"**
4. Haz clic en **"Listo"**

### 1.4 Habilitar Cloud Messaging (para notificaciones push)
1. Ve a **Configuración del proyecto** ⚙️ → **Cloud Messaging**
2. Verifica que **Firebase Cloud Messaging API (V1)** esté habilitado

---

## Paso 2: Registrar App Android

1. En Firebase Console → **Configuración del proyecto** ⚙️ → **Tus apps**
2. Haz clic en el icono Android 🤖
3. **Nombre de paquete de Android**: `com.calizalosos.mobile`
4. Haz clic en **"Registrar app"**
5. Descarga `google-services.json`
6. Cópialo a: `mobile/android/app/google-services.json`

> ⚠️ **IMPORTANTE**: Este archivo es necesario para que la app Android funcione con Firebase.

---

## Paso 3: Registrar App Web

1. En Firebase Console → **Tus apps** → Haz clic en icono `</>` (Web)
2. **Nombre de la app**: `Caliza Los Osos Web`
3. Habilita **Firebase Hosting** (opcional)
4. Haz clic en **"Registrar app"**
5. Copia el valor de `appId` (ej: `1:321221946315:web:xxxxx`)
6. Actualiza `web/src/config/firebase.ts` con el `appId` correcto
7. Actualiza `backend/.env` con el `FIREBASE_APP_ID` correcto

---

## Paso 4: Configurar Service Account para Laravel

1. Ve a **Configuración del proyecto** ⚙️ → **Cuentas de servicio**
2. Haz clic en **"Generar nueva clave privada"**
3. Se descargará un archivo JSON
4. Renómbralo a `service-account.json`
5. Cópialo a: `backend/storage/app/service-account.json`

---

## Paso 5: Configurar Firestore Rules

En **Firestore Database** → **Reglas**, pega:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Trucks
    match /trucks/{truckId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Drivers
    match /drivers/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Clients
    match /clients/{clientId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Suppliers
    match /suppliers/{supplierId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Trips
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Inventory
    match /inventory/{inventoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Invoices
    match /invoices/{invoiceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Accounts Receivable
    match /accountReceivable/{accountId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Accounts Payable
    match /accountPayable/{accountId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Payrolls
    match /payrolls/{payrollId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Settings
    match /settings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Alerts
    match /alerts/{alertId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Daily Metrics
    match /dailyMetrics/{dateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Maintenances
    match /maintenances/{maintenanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Paso 6: Configurar Storage Rules

En **Storage** → **Reglas**, pega:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                    && request.resource.size < 10 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## Paso 7: Crear Índices de Firestore

En **Firestore Database** → **Índices**, crea los siguientes índices compuestos:

| Colección | Campos | Orden |
|---|---|---|
| `trips` | `status` ASC, `scheduled_date` DESC | Para filtrar viajes por estado |
| `trips` | `truck_id` ASC, `created_at` DESC | Para historial por camión |
| `trips` | `driver_id` ASC, `created_at` DESC | Para historial por conductor |
| `trips` | `client_id` ASC, `created_at` DESC | Para historial por cliente |
| `invoices` | `status` ASC, `due_date` ASC | Para facturas vencidas |
| `invoices` | `client_id` ASC, `status` ASC | Para CxC por cliente |
| `invoices` | `supplier_id` ASC, `status` ASC | Para CxP por proveedor |
| `maintenances` | `truck_id` ASC, `service_date` DESC | Para historial mantenimiento |
| `accountReceivable` | `status` ASC, `due_date` ASC | Para CxC pendientes |
| `accountPayable` | `status` ASC, `due_date` ASC | Para CxP pendientes |

---

## Paso 8: Verificar la configuración

### 8.1 Verificar Laravel
```bash
cd backend
C:\php83\php.exe artisan tinker
>>> $firebase = app(\App\Services\FirebaseService::class);
>>> $firebase->isConfigured();
=> true
```

### 8.2 Verificar Flutter
```bash
cd mobile
dart analyze lib
# Debe mostrar: No issues found!

flutter run
```

### 8.3 Verificar React
```bash
cd web
npm run dev
```

---

## Resumen de archivos

| Archivo | Ubicación | Estado |
|---|---|---|
| `GoogleService-Info.plist` | `mobile/ios/Runner/` | ✅ Ya existe con credenciales reales |
| `google-services.json` | `mobile/android/app/` | ⏳ **Necesitas descargar** (Paso 2) |
| `service-account.json` | `backend/storage/app/` | ⏳ **Necesitas descargar** (Paso 4) |
| `.env` (Firebase) | `backend/` | ✅ Configurado con project_id `caliza360` |
| `firebase_options.dart` | `mobile/lib/` | ✅ Configurado con credenciales reales |
| `AppDelegate.swift` | `mobile/ios/Runner/` | ✅ Configurado con `FirebaseApp.configure()` |
| `firebase.ts` | `web/src/config/` | ✅ Creado (necesita `appId` real) |
| `android/build.gradle.kts` | `mobile/android/` | ✅ Configurado con google-services |
| `app/build.gradle.kts` | `mobile/android/app/` | ✅ Configurado con google-services plugin |

---

## Pendiente (requiere acción manual)

1. **Descargar `google-services.json`** desde Firebase Console → Paso 2
2. **Descargar `service-account.json`** desde Firebase Console → Paso 4
3. **Obtener `appId` web** desde Firebase Console → Paso 3
4. **Actualizar `FIREBASE_APP_ID`** en `backend/.env` con el `appId` web real
5. **Actualizar `appId`** en `web/src/config/firebase.ts` con el valor real

---

## Solución de problemas

### Error: "Firebase not configured" (Laravel)
- Verifica que `service-account.json` existe en `backend/storage/app/`
- Verifica las variables en `backend/.env`
- Ejecuta: `C:\php83\php.exe artisan config:clear`

### Error: "No Firebase App '[DEFAULT]' has been created" (Flutter)
- Verifica que `google-services.json` está en `mobile/android/app/`
- Verifica que `firebase_options.dart` tiene los valores correctos
- Verifica que `AppDelegate.swift` tiene `FirebaseApp.configure()`

### Error: "Permission denied" (Firestore)
- Revisa las reglas de Firestore en la consola (Paso 5)
- Asegúrate de que el usuario está autenticado
- Verifica que Authentication está habilitado (Paso 1.1)

### Error: "Storage unauthorized"
- Revisa las reglas de Storage en la consola (Paso 6)
- Verifica que Storage está habilitado (Paso 1.3)

### Error: "Quota exceeded"
- Verifica tu plan de Firebase (Gratuito tiene límites)
- Revisa usage en Firebase Console → Usage and billing

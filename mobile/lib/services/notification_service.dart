import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification tap
      },
    );

    _initialized = true;
  }

  Future<void> showTripNotification({
    required String title,
    required String body,
    required String tripId,
  }) async {
    if (!_initialized) await initialize();

    const androidDetails = AndroidNotificationDetails(
      'trip_updates',
      'Actualizaciones de Viajes',
      channelDescription: 'Notificaciones de cambios en viajes',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      id: tripId.hashCode,
      title: title,
      body: body,
      notificationDetails: details,
    );
  }

  Future<void> showMaintenanceAlert({
    required String truckPlate,
    required String message,
  }) async {
    if (!_initialized) await initialize();

    const androidDetails = AndroidNotificationDetails(
      'maintenance_alerts',
      'Alertas de Mantenimiento',
      channelDescription: 'Alertas de mantenimiento pendiente',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      id: truckPlate.hashCode,
      title: 'Mantenimiento: $truckPlate',
      body: message,
      notificationDetails: details,
    );
  }

  Future<void> showInventoryAlert({
    required String productName,
    required double currentStock,
    required double minStock,
  }) async {
    if (!_initialized) await initialize();

    const androidDetails = AndroidNotificationDetails(
      'inventory_alerts',
      'Alertas de Inventario',
      channelDescription: 'Alertas de stock bajo',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      id: productName.hashCode,
      title: 'Stock Bajo: $productName',
      body: 'Stock actual: $currentStock | Mínimo: $minStock',
      notificationDetails: details,
    );
  }

  Future<void> checkAndNotify(ApiService apiService) async {
    try {
      // Check for in-transit trips that need attention
      final trips = await apiService.getTrips();
      final inTransitTrips = trips.where((t) => t['status'] == 'in_transit').toList();

      for (final trip in inTransitTrips) {
        final prefs = await SharedPreferences.getInstance();
        final notifiedKey = 'notified_trip_${trip['id']}';
        final alreadyNotified = prefs.getBool(notifiedKey) ?? false;

        if (!alreadyNotified) {
          final tripId = trip['id']?.toString() ?? 'desconocido';
          await showTripNotification(
            title: 'Viaje en curso',
            body: 'Viaje #${tripId.length > 8 ? tripId.substring(0, 8) : tripId} - ${trip['destination_name'] ?? 'Destino'}',
            tripId: tripId,
          );
          await prefs.setBool(notifiedKey, true);
        }
      }
    } catch (e) {
      // Silently fail - notifications are non-critical
    }
  }

  Future<void> cancelAll() async {
    await _notifications.cancelAll();
  }
}

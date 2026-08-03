import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineSyncService {
  static const String _pendingTripsKey = 'pending_trips';
  static const String _pendingEvidenceKey = 'pending_evidence';
  static const String _pendingLocationsKey = 'pending_locations';
  static const String _lastSyncKey = 'last_sync_time';

  /// Save a trip locally when offline
  Future<void> savePendingTrip(Map<String, dynamic> tripData) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingTripsKey) ?? [];
    pending.add(jsonEncode({
      ...tripData,
      'timestamp': DateTime.now().toIso8601String(),
      'synced': false,
    }));
    await prefs.setStringList(_pendingTripsKey, pending);
  }

  /// Save evidence (photos + signature) locally when offline
  Future<void> savePendingEvidence({
    required String tripId,
    required String signatureBase64,
    required double? latitude,
    required double? longitude,
    required List<String> photoPaths,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingEvidenceKey) ?? [];
    pending.add(jsonEncode({
      'trip_id': tripId,
      'signature': signatureBase64,
      'latitude': latitude,
      'longitude': longitude,
      'photos': photoPaths,
      'timestamp': DateTime.now().toIso8601String(),
      'synced': false,
    }));
    await prefs.setStringList(_pendingEvidenceKey, pending);
  }

  /// Get all pending trips that need to be synced
  Future<List<Map<String, dynamic>>> getPendingTrips() async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingTripsKey) ?? [];
    return pending.map((e) => jsonDecode(e) as Map<String, dynamic>).toList();
  }

  /// Get all pending evidence that needs to be synced
  Future<List<Map<String, dynamic>>> getPendingEvidence() async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingEvidenceKey) ?? [];
    return pending.map((e) => jsonDecode(e) as Map<String, dynamic>).toList();
  }

  /// Mark a trip as synced
  Future<void> markTripSynced(int index) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingTripsKey) ?? [];
    if (index < pending.length) {
      pending.removeAt(index);
      await prefs.setStringList(_pendingTripsKey, pending);
    }
  }

  /// Mark evidence as synced
  Future<void> markEvidenceSynced(int index) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingEvidenceKey) ?? [];
    if (index < pending.length) {
      pending.removeAt(index);
      await prefs.setStringList(_pendingEvidenceKey, pending);
    }
  }

  /// Save a location locally when offline (GPS telemetry queue)
  Future<void> savePendingLocation({
    required String tripId,
    required double latitude,
    required double longitude,
    double? speed,
    double? accuracy,
    String? recordedAt,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingLocationsKey) ?? [];
    pending.add(jsonEncode({
      'trip_id': tripId,
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
      'accuracy': accuracy,
      'recorded_at': recordedAt ?? DateTime.now().toIso8601String(),
    }));
    await prefs.setStringList(_pendingLocationsKey, pending);
  }

  /// Get all pending locations that need to be synced
  Future<List<Map<String, dynamic>>> getPendingLocations() async {
    final prefs = await SharedPreferences.getInstance();
    final pending = prefs.getStringList(_pendingLocationsKey) ?? [];
    return pending.map((e) => jsonDecode(e) as Map<String, dynamic>).toList();
  }

  /// Replace the stored pending locations (used after a successful flush).
  Future<void> replacePendingLocations(List<Map<String, dynamic>> locations) async {
    final prefs = await SharedPreferences.getInstance();
    final pending = locations.map((e) => jsonEncode(e)).toList();
    await prefs.setStringList(_pendingLocationsKey, pending);
  }

  /// Count of pending locations
  Future<int> getPendingLocationCount() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_pendingLocationsKey) ?? []).length;
  }

  /// Get count of pending items
  Future<int> getPendingCount() async {
    final trips = await getPendingTrips();
    final evidence = await getPendingEvidence();
    return trips.length + evidence.length;
  }

  /// Update last sync time
  Future<void> updateLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastSyncKey, DateTime.now().toIso8601String());
  }

  /// Get last sync time
  Future<String?> getLastSyncTime() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_lastSyncKey);
  }

  /// Clear all pending data
  Future<void> clearPending() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_pendingTripsKey);
    await prefs.remove(_pendingEvidenceKey);
  }
}

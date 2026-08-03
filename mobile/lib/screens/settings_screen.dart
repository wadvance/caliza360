import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/notification_service.dart';
import '../services/offline_sync_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _autoSync = true;
  String _serverUrl = 'https://calizalososos-api.onrender.com/api';
  int _pendingSyncCount = 0;
  String _lastSync = 'Nunca';
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _loadSyncInfo();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
      _autoSync = prefs.getBool('auto_sync') ?? true;
      _serverUrl = prefs.getString('server_url') ?? 'http://localhost:8000/api';
    });
  }

  Future<void> _loadSyncInfo() async {
    final syncService = OfflineSyncService();
    final count = await syncService.getPendingCount();
    final lastSync = await syncService.getLastSyncTime();
    setState(() {
      _pendingSyncCount = count;
      _lastSync = lastSync ?? 'Nunca';
    });
  }

  Future<void> _saveSetting(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is bool) {
      await prefs.setBool(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    }
  }

  Future<void> _syncNow() async {
    setState(() => _isSyncing = true);

    try {
      final syncService = OfflineSyncService();
      final pendingTrips = await syncService.getPendingTrips();
      final pendingEvidence = await syncService.getPendingEvidence();

      // In a real app, you would send these to the server here
      // For now, we'll just clear them after a simulated sync
      await Future.delayed(const Duration(seconds: 2));

      await syncService.clearPending();
      await syncService.updateLastSyncTime();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sincronización completada: ${pendingTrips.length + pendingEvidence.length} elementos'),
            backgroundColor: Colors.green,
          ),
        );
        _loadSyncInfo();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error de sincronización: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() => _isSyncing = false);
    }
  }

  Future<void> _testNotification() async {
    final notificationService = NotificationService();
    await notificationService.showTripNotification(
      title: 'Prueba de notificación',
      body: 'Las notificaciones están funcionando correctamente',
      tripId: 'test',
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notificación de prueba enviada')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuración'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Sync Status Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Estado de Sincronización',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        if (_isSyncing)
                          const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(Icons.cloud_sync, 'Última sincronización', _lastSync),
                    _buildInfoRow(Icons.pending, 'Elementos pendientes', '$_pendingSyncCount'),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isSyncing ? null : _syncNow,
                        icon: const Icon(Icons.sync),
                        label: Text(_isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Notifications Settings
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Notificaciones',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      title: const Text('Notificaciones push'),
                      subtitle: const Text('Recibir alertas de viajes y mantenimiento'),
                      value: _notificationsEnabled,
                      onChanged: (value) {
                        setState(() => _notificationsEnabled = value);
                        _saveSetting('notifications_enabled', value);
                      },
                      activeThumbColor: const Color(0xFF2563EB),
                    ),
                    const Divider(),
                    ListTile(
                      title: const Text('Probar notificación'),
                      subtitle: const Text('Enviar una notificación de prueba'),
                      trailing: const Icon(Icons.send),
                      onTap: _testNotification,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Sync Settings
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sincronización',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      title: const Text('Sincronización automática'),
                      subtitle: const Text('Sincronizar datos cuando haya conexión'),
                      value: _autoSync,
                      onChanged: (value) {
                        setState(() => _autoSync = value);
                        _saveSetting('auto_sync', value);
                      },
                      activeThumbColor: const Color(0xFF2563EB),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Server Settings
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Servidor',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: _serverUrl,
                      decoration: InputDecoration(
                        labelText: 'URL del servidor',
                        hintText: 'https://calizalososos-api.onrender.com/api',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onChanged: (value) {
                        _saveSetting('server_url', value);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // About
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Acerca de',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(Icons.local_shipping, 'App', 'Caliza Los Osos'),
                    _buildInfoRow(Icons.code, 'Versión', '1.0.0'),
                    _buildInfoRow(Icons.flutter_dash, 'Framework', 'Flutter'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey[600]),
          const SizedBox(width: 10),
          Text(
            '$label: ',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

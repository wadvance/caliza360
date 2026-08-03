import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';

class ProformaDetailScreen extends StatefulWidget {
  final Map<String, dynamic> proforma;

  const ProformaDetailScreen({super.key, required this.proforma});

  @override
  State<ProformaDetailScreen> createState() => _ProformaDetailScreenState();
}

class _ProformaDetailScreenState extends State<ProformaDetailScreen> {
  final _api = ApiService();
  Position? _currentPosition;
  Timer? _trackingTimer;
  bool _isTracking = false;
  GoogleMapController? _mapController;
  Map<String, dynamic>? _tracking;
  Timer? _trackingRefreshTimer;
  bool _trackingEnabled = false;
  bool _loadingTracking = false;
  bool _savingStatus = false;
  Map<String, dynamic> _proforma = {};

  @override
  void initState() {
    super.initState();
    _proforma = widget.proforma;
    _getCurrentLocation();
    if (_proforma['status'] == 'in_transit') {
      _enableTracking();
    }
  }

  @override
  void dispose() {
    _stopTracking();
    _stopTrackingRefresh();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (mounted) setState(() => _currentPosition = position);
    } catch (e) {
      debugPrint('Error getting location: $e');
    }
  }

  void _enableTracking() {
    if (_isTracking) return;
    _isTracking = true;
    _trackingEnabled = true;
    _trackingTimer = Timer.periodic(const Duration(seconds: 12), (_) {
      if (_currentPosition != null) {
        _sendCurrentLocation();
      } else {
        _getCurrentLocation();
      }
    });
    if (_currentPosition != null) {
      _sendCurrentLocation();
    } else {
      _getCurrentLocation();
    }
  }

  void _stopTracking() {
    _isTracking = false;
    _trackingTimer?.cancel();
    _trackingTimer = null;
  }

  Future<void> _sendCurrentLocation() async {
    final pos = _currentPosition;
    if (pos == null) return;
    try {
      await _api.sendProformaLocation(
        proformaId: _proforma['id'].toString(),
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        accuracy: pos.accuracy,
      );
    } catch (e) {
      debugPrint('Error enviando ubicación de cantera: $e');
    }
  }

  Future<void> _toggleTracking(bool enable) async {
    if (enable) {
      setState(() => _trackingEnabled = true);
      if (_proforma['status'] != 'in_transit') {
        await _updateStatus('in_transit');
      }
      _enableTracking();
      _startTrackingRefresh();
    } else {
      setState(() => _trackingEnabled = false);
      _stopTracking();
      _stopTrackingRefresh();
    }
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _savingStatus = true);
    try {
      final updated = await _api.updateProforma(
        _proforma['id'].toString(),
        {'status': status},
      );
      if (mounted) {
        setState(() {
          _proforma = updated;
          _savingStatus = false;
        });
        _showSnack(
          status == 'in_transit'
              ? 'Proforma en tránsito · GPS activo'
              : 'Recorrido finalizado',
          Colors.green,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _savingStatus = false);
        _showSnack('Error al actualizar estado: $e', Colors.red);
      }
    }
  }

  void _startTrackingRefresh() {
    if (_trackingRefreshTimer != null) return;
    _loadTracking();
    _trackingRefreshTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) _loadTracking();
    });
  }

  void _stopTrackingRefresh() {
    _trackingRefreshTimer?.cancel();
    _trackingRefreshTimer = null;
  }

  Future<void> _loadTracking() async {
    if (!_trackingEnabled) return;
    setState(() => _loadingTracking = true);
    try {
      final tracking = await _api.getProformaTracking(_proforma['id'].toString());
      if (mounted) {
        setState(() {
          _tracking = tracking;
          _loadingTracking = false;
        });
        _fitTrackingBounds(tracking);
      }
    } catch (e) {
      if (mounted) setState(() => _loadingTracking = false);
      debugPrint('Error al cargar seguimiento: $e');
    }
  }

  void _fitTrackingBounds(Map<String, dynamic> tracking) {
    final mapController = _mapController;
    if (mapController == null) return;

    final latLngs = <LatLng>[];
    final route = (tracking['route'] as List? ?? []);
    for (final p in route) {
      final lat = (p['latitude'] as num?)?.toDouble();
      final lng = (p['longitude'] as num?)?.toDouble();
      if (lat != null && lng != null) latLngs.add(LatLng(lat, lng));
    }
    final dest = tracking['destination'];
    final destLat = (dest?['latitude'] as num?)?.toDouble();
    final destLng = (dest?['longitude'] as num?)?.toDouble();
    if (destLat != null && destLng != null) latLngs.add(LatLng(destLat, destLng));

    if (latLngs.isEmpty) return;

    final bounds = _latLngBounds(latLngs);
    mapController.animateCamera(CameraUpdate.newLatLngBounds(bounds, 40));
  }

  LatLngBounds _latLngBounds(List<LatLng> points) {
    double southWestLat = points.first.latitude;
    double southWestLng = points.first.longitude;
    double northEastLat = points.first.latitude;
    double northEastLng = points.first.longitude;

    for (final p in points) {
      southWestLat = p.latitude < southWestLat ? p.latitude : southWestLat;
      southWestLng = p.longitude < southWestLng ? p.longitude : southWestLng;
      northEastLat = p.latitude > northEastLat ? p.latitude : northEastLat;
      northEastLng = p.longitude > northEastLng ? p.longitude : northEastLng;
    }

    return LatLngBounds(
      southwest: LatLng(southWestLat, southWestLng),
      northeast: LatLng(northEastLat, northEastLng),
    );
  }

  String _formatDuration(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    if (h > 0) return '${h}h $m m';
    return '$m min';
  }

  void _showSnack(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = _proforma;
    final status = p['status'] ?? 'created';

    return Scaffold(
      appBar: AppBar(
        title: Text(p['proforma_number'] ?? 'Cantera'),
        backgroundColor: const Color(0xFFB45309),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                          'Carga de cantera',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.orange),
                          ),
                          child: Text(
                            _statusText(status),
                            style: const TextStyle(
                              color: Colors.orange,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(Icons.route, 'Cantera', p['origin_quarry'] ?? '—'),
                    _buildInfoRow(Icons.location_on, 'Destino', p['destination_name'] ?? '—'),
                    _buildInfoRow(Icons.local_shipping, 'Camión', p['truck']?['plate'] ?? '—'),
                    _buildInfoRow(Icons.person, 'Camionero', p['driver']?['name'] ?? '—'),
                    _buildInfoRow(Icons.inventory, 'Material', p['material_type'] ?? '—'),
                    _buildInfoRow(Icons.scale, 'Peso', '${p['weight_tons'] ?? 0} ton'),
                    _buildInfoRow(Icons.inventory_2, 'Sacos', '${p['sack_count'] ?? 0}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _buildTrackingCard(status),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _statusText(String status) {
    switch (status) {
      case 'created':
        return 'Creada';
      case 'loaded':
        return 'Cargada';
      case 'in_transit':
        return 'En tránsito';
      case 'delivered':
        return 'Entregada';
      default:
        return status;
    }
  }

  Widget _buildTrackingCard(String status) {
    final tracking = _tracking;
    final route = (tracking?['route'] as List? ?? []).cast<Map<String, dynamic>>();
    final stops = (tracking?['stops'] as List? ?? []).cast<Map<String, dynamic>>();
    final dest = tracking?['destination'];
    final stats = (tracking?['stats'] as Map<String, dynamic>?) ?? {};
    final progress = (tracking?['progress'] as Map<String, dynamic>?) ?? {};

    final polylinePoints = route
        .map((pt) => LatLng(
              ((pt['latitude'] as num?)?.toDouble() ?? 0),
              ((pt['longitude'] as num?)?.toDouble() ?? 0),
            ))
        .toList();

    final destLat = (dest?['latitude'] as num?)?.toDouble();
    final destLng = (dest?['longitude'] as num?)?.toDouble();

    final markers = <Marker>{};
    if (destLat != null && destLng != null) {
      markers.add(Marker(
        markerId: const MarkerId('destination'),
        position: LatLng(destLat, destLng),
        infoWindow: InfoWindow(title: 'Destino', snippet: dest?['name'] ?? ''),
      ));
    }
    for (var i = 0; i < stops.length; i++) {
      final s = stops[i];
      markers.add(Marker(
        markerId: MarkerId('stop_$i'),
        position: LatLng(
          ((s['latitude'] as num?)?.toDouble() ?? 0),
          ((s['longitude'] as num?)?.toDouble() ?? 0),
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: InfoWindow(
          title: 'Parada ${i + 1}',
          snippet: 'Duración: ${_formatDuration((s['duration_seconds'] as num?)?.toInt() ?? 0)}',
        ),
      ));
    }
    if (_currentPosition != null) {
      markers.add(Marker(
        markerId: const MarkerId('current'),
        position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(title: 'Ubicación actual'),
      ));
    }

    final polylines = polylinePoints.length >= 2
        ? {
            Polyline(
              polylineId: const PolylineId('route'),
              points: polylinePoints,
              color: const Color(0xFFB45309),
              width: 5,
            ),
          }
        : <Polyline>{};

    final initialCamera = polylinePoints.isNotEmpty
        ? CameraPosition(target: polylinePoints.first, zoom: 12)
        : CameraPosition(
            target: LatLng(
              _currentPosition?.latitude ?? 8.537,
              _currentPosition?.longitude ?? -80.7821,
            ),
            zoom: 7,
          );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Seguimiento GPS del camión',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: (_trackingEnabled ? Colors.green : Colors.grey)
                        .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _trackingEnabled ? Colors.green : Colors.grey),
                  ),
                  child: Text(
                    _trackingEnabled ? 'GPS activo' : 'GPS apagado',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _trackingEnabled ? Colors.green : Colors.grey,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Switch(value: _trackingEnabled, onChanged: _toggleTracking),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Activa el GPS cuando el camión salga hacia la cantera. El recorrido queda visible solo para Super Admin y Administrador.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Container(
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: GoogleMap(
                  initialCameraPosition: initialCamera,
                  polylines: polylines,
                  markers: markers,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: true,
                  onMapCreated: (controller) => _mapController = controller,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildStatChip(Icons.route, 'Recorrido', '${(stats['distance_traveled_km'] as num? ?? 0).toStringAsFixed(1)} km'),
                _buildStatChip(Icons.flag, 'Progreso', '${(progress['percent'] as num? ?? 0).toStringAsFixed(0)}%'),
                _buildStatChip(Icons.near_me, 'Restante', progress['remaining_distance_km'] == null ? '—' : '${(progress['remaining_distance_km'] as num).toStringAsFixed(1)} km'),
                _buildStatChip(Icons.pause_circle, 'Paradas', '${stats['stops_count'] ?? 0}'),
                _buildStatChip(Icons.hourglass_bottom, 'Estacionado', _formatDuration((stats['stationary_time_seconds'] as num?)?.toInt() ?? 0)),
              ],
            ),
            if (stops.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Paradas', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...stops.map((s) {
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  leading: const Icon(Icons.stop_circle, color: Colors.red),
                  title: Text('Parada · ${_formatDuration((s['duration_seconds'] as num?)?.toInt() ?? 0)}'),
                  subtitle: Text(
                    '${((s['latitude'] as num?)?.toDouble() ?? 0).toStringAsFixed(5)}, ${((s['longitude'] as num?)?.toDouble() ?? 0).toStringAsFixed(5)}',
                  ),
                );
              }),
            ],
            if (route.isEmpty && !_loadingTracking)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Aún no hay puntos GPS registrados para esta proforma.',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ),
            if (status == 'in_transit') ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _savingStatus ? null : () => _updateStatus('delivered'),
                  icon: _savingStatus
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.flag),
                  label: const Text('Finalizar recorrido'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFB45309).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFB45309).withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFFB45309)),
          const SizedBox(width: 4),
          Text('$label: ', style: const TextStyle(fontSize: 12, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
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
          Text('$label: ', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

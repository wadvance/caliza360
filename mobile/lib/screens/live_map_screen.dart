import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/api_service.dart';

class LiveMapScreen extends StatefulWidget {
  const LiveMapScreen({super.key});

  @override
  State<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends State<LiveMapScreen> {
  GoogleMapController? _mapController;
  Map<String, dynamic>? _fleetData;
  bool _isLoading = true;
  String _errorMessage = '';
  double _radiusKm = 2;
  final ApiService _apiService = ApiService();

  static const double _defaultLat = 8.5190;
  static const double _defaultLng = -80.3570;

  @override
  void initState() {
    super.initState();
    _loadFleet();
    _startPolling();
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  BitmapDescriptor _markerIcon(String zone) {
    switch (zone) {
      case 'in_quarry':
        return BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange);
      case 'on_route':
        return BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue);
      case 'at_destination':
        return BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen);
      default:
        return BitmapDescriptor.defaultMarker;
    }
  }

  Future<void> _loadFleet() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = '';
      });
    }
    try {
      final data = await _apiService.getFleetLive(radiusKm: _radiusKm);
      if (mounted) {
        setState(() {
          _fleetData = data;
          _isLoading = false;
        });
        _centerMapOnFleet(data);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
      _retryLoad();
    }
  }

  Future<void> _retryLoad() async {
    for (int i = 1; i <= 3; i++) {
      await Future.delayed(Duration(seconds: i * 3));
      if (!mounted) return;
      try {
        final data = await _apiService.getFleetLive(radiusKm: _radiusKm);
        if (mounted) {
          setState(() {
            _fleetData = data;
            _isLoading = false;
            _errorMessage = '';
          });
          _centerMapOnFleet(data);
          return;
        }
      } catch (_) {
        if (mounted) {
          setState(() => _errorMessage =
              'Reintentando... ($i/3) No se pudo conectar con el servidor de telemetría.');
        }
      }
    }
    if (mounted) {
      setState(() => _errorMessage =
          'No se pudo conectar con el servidor de telemetría. Verifica tu conexión a internet e intenta de nuevo.');
    }
  }

  void _centerMapOnFleet(Map<String, dynamic> data) {
    final units = data['units'] as List?;
    if (units == null || units.isEmpty) return;
    final mapController = _mapController;
    if (mapController == null) return;

    double minLat = double.infinity;
    double maxLat = double.negativeInfinity;
    double minLng = double.infinity;
    double maxLng = double.negativeInfinity;

    for (final unit in units) {
      final loc = unit['location'];
      if (loc != null && loc['latitude'] != null && loc['longitude'] != null) {
        final lat = loc['latitude'] as double;
        final lng = loc['longitude'] as double;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
    }

    if (minLat == double.infinity) return;

    final center = LatLng(
      (minLat + maxLat) / 2,
      (minLng + maxLng) / 2,
    );
    final zoom = _calculateZoom(minLat, maxLat, minLng, maxLng);
    mapController.animateCamera(CameraUpdate.newLatLngZoom(center, zoom));
  }

  double _calculateZoom(double minLat, double maxLat, double minLng, double maxLng) {
    final latSpan = (maxLat - minLat).abs();
    final lngSpan = (maxLng - minLng).abs();
    final maxSpan = latSpan > lngSpan ? latSpan : lngSpan;
    if (maxSpan < 0.01) return 15;
    if (maxSpan < 0.05) return 14;
    if (maxSpan < 0.1) return 13;
    if (maxSpan < 0.5) return 12;
    if (maxSpan < 1) return 11;
    return 10;
  }

  void _startPolling() {
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) _loadFleet();
    });
  }

  Color _zoneColor(String zone) {
    switch (zone) {
      case 'in_quarry':
        return const Color(0xFFFFA000);
      case 'on_route':
        return const Color(0xFF2196F3);
      case 'at_destination':
        return const Color(0xFF4CAF50);
      default:
        return Colors.grey;
    }
  }

  String _zoneLabel(String zone) {
    switch (zone) {
      case 'in_quarry':
        return 'En cantera';
      case 'on_route':
        return 'En ruta';
      case 'at_destination':
        return 'En destino';
      default:
        return 'Sin señal';
    }
  }

  Set<Marker> _buildMarkers() {
    final markers = <Marker>{};
    final units = _fleetData?['units'] as List?;
    if (units == null) return markers;

    for (final unit in units) {
      final loc = unit['location'];
      if (loc == null || loc['latitude'] == null || loc['longitude'] == null) continue;

      final lat = loc['latitude'] as double;
      final lng = loc['longitude'] as double;
      final zone = unit['zone'] as String? ?? 'unknown';
      final unitId = 'unit_${unit['id']}_${unit['type']}';

      markers.add(
        Marker(
          markerId: MarkerId(unitId),
          position: LatLng(lat, lng),
          infoWindow: InfoWindow(
            title: unit['truck_plate'] ?? 'Sin placa',
            snippet: '${unit['driver_name'] ?? 'N/A'} | ${_zoneLabel(zone)} | ${unit['status']}',
          ),
          icon: _markerIcon(zone),
        ),
      );
    }

    return markers;
  }

  Set<Polyline> _buildPolylines() {
    final polylines = <Polyline>{};
    final units = _fleetData?['units'] as List?;
    if (units == null) return polylines;

    for (final unit in units) {
      final loc = unit['location'];
      if (loc == null || loc['latitude'] == null) continue;

      final originLat = unit['origin_lat'];
      final originLng = unit['origin_lng'];
      final destLat = unit['destination_lat'];
      final destLng = unit['destination_lng'];

      if (originLat == null || originLng == null) continue;

      final points = <LatLng>[
        LatLng(originLat as double, originLng as double),
        LatLng(loc['latitude'] as double, loc['longitude'] as double),
      ];

      if (destLat != null && destLng != null) {
        points.add(LatLng(destLat as double, destLng as double));
      }

      final zone = unit['zone'] as String? ?? 'unknown';
      final color = _zoneColor(zone);

      polylines.add(
        Polyline(
          polylineId: PolylineId('route_${unit['id']}'),
          points: points,
          color: color.withValues(alpha: 0.7),
          width: 4,
        ),
      );
    }

    return polylines;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
          tooltip: 'Regresar al menú',
        ),
        title: const Text('Mapa de Flota'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadFleet,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.wifi_off, size: 64, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 16, color: Colors.grey),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _loadFleet,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  ),
                )
              : Stack(
                  children: [
                    GoogleMap(
                      onMapCreated: (controller) {
                        _mapController = controller;
                        if (_fleetData != null) {
                          _centerMapOnFleet(_fleetData!);
                        }
                      },
                      initialCameraPosition: const CameraPosition(
                        target: LatLng(_defaultLat, _defaultLng),
                        zoom: 12,
                      ),
                      markers: _buildMarkers(),
                      polylines: _buildPolylines(),
                      myLocationEnabled: true,
                      myLocationButtonEnabled: true,
                      zoomControlsEnabled: true,
                    ),
                    Positioned(
                      bottom: 16,
                      left: 16,
                      right: 16,
                      child: _buildLegend(),
                    ),
                  ],
                ),
    );
  }

  Widget _buildLegend() {
    final zones = _fleetData?['zones'] as Map?;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Zonas de geocerca',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: 8),
          _legendRow(Icons.location_on, 'En cantera', _zoneColor('in_quarry'), zones?['in_quarry']),
          _legendRow(Icons.directions_car, 'En ruta', _zoneColor('on_route'), zones?['on_route']),
          _legendRow(Icons.location_on, 'En destino', _zoneColor('at_destination'), zones?['at_destination']),
          _legendRow(Icons.signal_cellular_alt, 'Sin señal', _zoneColor('unknown'), zones?['unknown']),
        ],
      ),
    );
  }

  Widget _legendRow(IconData icon, String label, Color color, dynamic count) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 12)),
          const Spacer(),
          Text(
            '${count ?? 0}',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}

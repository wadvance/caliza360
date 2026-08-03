import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/offline_sync_service.dart';

class TripDetailScreen extends StatefulWidget {
  final Map<String, dynamic> trip;

  const TripDetailScreen({super.key, required this.trip});

  @override
  State<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends State<TripDetailScreen> {
  final SignatureController _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
  );
  final ImagePicker _picker = ImagePicker();
  final List<File> _photos = [];
  Position? _currentPosition;
  bool _isSaving = false;
  Timer? _trackingTimer;
  bool _isTracking = false;
  GoogleMapController? _mapController;
  Map<String, dynamic>? _tracking;
  Timer? _trackingRefreshTimer;
  bool _trackingEnabled = true;
  bool _loadingTracking = false;
  final TextEditingController _grossController = TextEditingController();
  final TextEditingController _tareController = TextEditingController();
  final TextEditingController _batchController = TextEditingController();
  final TextEditingController _qaInspectorController = TextEditingController();
  final TextEditingController _qaNotesController = TextEditingController();
  String _qaStatus = 'approved';
  bool _isWeighing = false;
  bool _isSavingQa = false;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    if (widget.trip['status'] == 'in_transit') {
      _startTracking();
      _startTrackingRefresh();
    }
  }

  @override
  void dispose() {
    _stopTracking();
    _stopTrackingRefresh();
    _mapController?.dispose();
    _signatureController.dispose();
    _grossController.dispose();
    _tareController.dispose();
    _batchController.dispose();
    _qaInspectorController.dispose();
    _qaNotesController.dispose();
    super.dispose();
  }

  Future<void> _submitGross() async {
    final raw = _grossController.text;
    if (raw.isEmpty) return;
    setState(() => _isWeighing = true);
    try {
      final api = ApiService();
      await api.recordGross(
        tripId: widget.trip['id'].toString(),
        grossWeight: double.tryParse(raw) ?? 0,
      );
      if (mounted) {
        _showSnack('Peso bruto registrado', Colors.green);
        _grossController.clear();
      }
    } catch (e) {
      if (mounted) _showSnack('Error al registrar bruto: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _isWeighing = false);
    }
  }

  Future<void> _submitTare() async {
    final raw = _tareController.text.trim();
    if (raw.isEmpty) return;
    setState(() => _isWeighing = true);
    try {
      final api = ApiService();
      await api.recordTare(
        tripId: widget.trip['id'].toString(),
        tareWeight: double.parse(raw),
      );
      if (mounted) {
        _showSnack('Tara registrada, peso neto calculado', Colors.green);
        _tareController.clear();
      }
    } catch (e) {
      if (mounted) _showSnack('Error al registrar tara: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _isWeighing = false);
    }
  }

  Future<void> _submitQuality() async {
    setState(() => _isSavingQa = true);
    try {
      final api = ApiService();
      await api.recordQuality(
        tripId: widget.trip['id'].toString(),
        qualityStatus: _qaStatus,
        qualityNotes: _qaNotesController.text.trim().isEmpty ? null : _qaNotesController.text.trim(),
        qualityInspector: _qaInspectorController.text.trim().isEmpty ? null : _qaInspectorController.text.trim(),
        batchCode: _batchController.text.trim().isEmpty ? null : _batchController.text.trim(),
      );
      if (mounted) {
        _showSnack('Control de calidad registrado', Colors.green);
        _batchController.clear();
        _qaInspectorController.clear();
        _qaNotesController.clear();
      }
    } catch (e) {
      if (mounted) _showSnack('Error al registrar calidad: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _isSavingQa = false);
    }
  }

  void _showSnack(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: color),
    );
  }

  /// Envía la ubicación GPS actual al backend. Empieza en cuanto el viaje
  /// está en tránsito y se repite cada pocos segundos (telemetría de flota).
  void _startTracking() {
    if (_isTracking) return;
    _isTracking = true;
    _trackingTimer = Timer.periodic(const Duration(seconds: 12), (_) {
      if (_currentPosition != null) {
        _sendCurrentLocation();
      } else {
        _getCurrentLocation();
      }
    });
    // Enviar una primera ubicación de forma inmediata.
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
    final apiService = ApiService();
    try {
      await apiService.sendTripLocation(
        tripId: widget.trip['id'].toString(),
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        accuracy: pos.accuracy,
      );
    } catch (e) {
      debugPrint('Sin red, encolando ubicación: $e');
      final offline = OfflineSyncService();
      await offline.savePendingLocation(
        tripId: widget.trip['id'].toString(),
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        accuracy: pos.accuracy,
      );
    }
    // Ambos caminos: al recuperar conexión se reenvía el histórico guardado.
    await _flushPendingLocations();
  }

  /// Envía las ubicaciones encoladas offline en lotes por viaje y limpia la cola.
  Future<void> _flushPendingLocations() async {
    final offline = OfflineSyncService();
    final pending = await offline.getPendingLocations();
    if (pending.isEmpty) return;

    final byTrip = <String, List<Map<String, dynamic>>>{};
    for (final p in pending) {
      byTrip.putIfAbsent(p['trip_id'].toString(), () => []).add(p);
    }

    final sent = <Map<String, dynamic>>[];
    final apiService = ApiService();
    for (final entry in byTrip.entries) {
      try {
        await apiService.sendTripLocationBatch(entry.key, entry.value);
        sent.addAll(entry.value);
      } catch (e) {
        debugPrint('Flush de ubicaciones pendiente: $e');
      }
    }

    if (sent.isNotEmpty) {
      final remaining = pending
          .where((p) => !sent.any((s) => identical(s, p)))
          .toList();
      await offline.replacePendingLocations(remaining);
    }
  }

  /// Refresca periódicamente el resumen de seguimiento (recorrido/paradas).
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

  void _toggleTracking(bool enable) {
    setState(() => _trackingEnabled = enable);
    if (enable) {
      _startTracking();
      _startTrackingRefresh();
    } else {
      _stopTracking();
      _stopTrackingRefresh();
    }
  }

  Future<void> _loadTracking() async {
    if (!_trackingEnabled) return;
    setState(() => _loadingTracking = true);
    try {
      final api = ApiService();
      final tracking = await api.getTripTracking(widget.trip['id'].toString());
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

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      setState(() {
        _currentPosition = position;
      });
    } catch (e) {
      debugPrint('Error getting location: $e');
    }
  }

  Future<void> _takePhoto() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
      maxWidth: 1200,
    );
    if (photo != null) {
      setState(() {
        _photos.add(File(photo.path));
      });
    }
  }

  Future<void> _pickFromGallery() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
      maxWidth: 1200,
    );
    if (photo != null) {
      setState(() {
        _photos.add(File(photo.path));
      });
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
    });
  }

  Future<void> _submitEvidence() async {
    if (_signatureController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor capture la firma de entrega')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final apiService = ApiService();
      final tripId = widget.trip['id'];

      // Enviar ubicación final como evidencia de la entrega y detener tracking.
      await _sendCurrentLocation();
      _stopTracking();

      // Convertir cada foto capturada a data-URI base64 para el backend.
      final photos = <String>[];
      for (final file in _photos) {
        final bytes = await file.readAsBytes();
        final b64 = base64Encode(bytes);
        photos.add('data:image/jpeg;base64,$b64');
      }

      // Firma a data-URI base64.
      final signatureBytes = await _signatureController.toPngBytes();
      var signatureDataUri = '';
      if (signatureBytes != null) {
        signatureDataUri = 'data:image/png;base64,${base64Encode(signatureBytes)}';
      }

      await apiService.uploadEvidence(
        tripId: tripId.toString(),
        signatureBase64: signatureDataUri,
        latitude: _currentPosition?.latitude,
        longitude: _currentPosition?.longitude,
        photoBase64: photos,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Evidencia de entrega registrada correctamente'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'scheduled': return Colors.blue;
      case 'in_transit': return Colors.orange;
      case 'delivered': return Colors.green;
      case 'returned': return Colors.purple;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'in_transit': return 'En Tránsito';
      case 'delivered': return 'Entregado';
      case 'returned': return 'Regresado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final trip = widget.trip;
    final status = trip['status'] ?? 'scheduled';

    return Scaffold(
      appBar: AppBar(
        title: Text('Viaje #${trip['id'].toString().substring(0, 8)}'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Trip status card
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
                          'Detalles del Viaje',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _getStatusColor(status).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _getStatusColor(status)),
                          ),
                          child: Text(
                            _getStatusText(status),
                            style: TextStyle(
                              color: _getStatusColor(status),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow(Icons.location_on, 'Origen', trip['origin_name'] ?? 'N/A'),
                    _buildInfoRow(Icons.flag, 'Destino', trip['destination_name'] ?? 'N/A'),
                    _buildInfoRow(Icons.inventory, 'Material', trip['material_type'] ?? 'N/A'),
                    _buildInfoRow(Icons.scale, 'Peso', '${trip['weight'] ?? 0} ton'),
                    _buildInfoRow(Icons.attach_money, 'Total', '\$${(trip['total_amount'] ?? 0).toStringAsFixed(2)}'),
                    if (trip['scheduled_date'] != null)
                      _buildInfoRow(Icons.calendar_today, 'Fecha', trip['scheduled_date']),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // GPS Location section
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
                          'Ubicación GPS',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.my_location),
                          onPressed: _getCurrentLocation,
                          tooltip: 'Actualizar ubicación',
                        ),
                      ],
                    ),
                    if (_currentPosition != null) ...[
                      _buildInfoRow(Icons.gps_fixed, 'Latitud', _currentPosition!.latitude.toStringAsFixed(6)),
                      _buildInfoRow(Icons.gps_fixed, 'Longitud', _currentPosition!.longitude.toStringAsFixed(6)),
                      _buildInfoRow(Icons.speed, 'Precisión', '${_currentPosition!.accuracy.toStringAsFixed(1)}m'),
                    ] else ...[
                      const Text(
                        'Obteniendo ubicación...',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      const LinearProgressIndicator(),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Seguimiento GPS (recorrido, paradas, tiempo estacionado)
            if (status == 'in_transit' || _tracking != null) ...[
              _buildTrackingCard(),
              const SizedBox(height: 16),
            ],

            // Photo evidence section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Evidencia Fotográfica',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _takePhoto,
                            icon: const Icon(Icons.camera_alt),
                            label: const Text('Tomar Foto'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _pickFromGallery,
                            icon: const Icon(Icons.photo_library),
                            label: const Text('Galería'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (_photos.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _photos.length,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.file(
                                      _photos[index],
                                      width: 100,
                                      height: 100,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: GestureDetector(
                                      onTap: () => _removePhoto(index),
                                      child: Container(
                                        decoration: const BoxDecoration(
                                          color: Colors.red,
                                          shape: BoxShape.circle,
                                        ),
                                        padding: const EdgeInsets.all(4),
                                        child: const Icon(Icons.close, size: 16, color: Colors.white),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Signature section
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
                          'Firma de Entrega',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        TextButton(
                          onPressed: () => _signatureController.clear(),
                          child: const Text('Limpiar'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Signature(
                        controller: _signatureController,
                        height: 200,
                        backgroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Firme en el recuadro superior',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Weighing (bascula) section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Báscula (Pesaje digital)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: _grossController,
                            keyboardType: TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'Peso bruto (ton)',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isWeighing ? null : _submitGross,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: _isWeighing
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Bruto'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextField(
                            controller: _tareController,
                            keyboardType: TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'Tara (ton)',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isWeighing ? null : _submitTare,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF4F46E5),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: _isWeighing
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Calcular Neto'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Quality control section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Control de Calidad',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text('Resultado: ', style: TextStyle(fontSize: 14, color: Colors.grey)),
                        const SizedBox(width: 8),
                        SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(value: 'approved', label: Text('Aprobar'), icon: Icon(Icons.check_circle_outline)),
                            ButtonSegment(value: 'rejected', label: Text('Rechazar'), icon: Icon(Icons.cancel_outlined)),
                          ],
                          selected: {_qaStatus},
                          onSelectionChanged: (selection) => setState(() => _qaStatus = selection.first),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _batchController,
                      decoration: const InputDecoration(
                        labelText: 'Código de lote',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _qaInspectorController,
                      decoration: const InputDecoration(
                        labelText: 'Inspector',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _qaNotesController,
                      decoration: const InputDecoration(
                        labelText: 'Notas (granulometría, observaciones)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _isSavingQa ? null : _submitQuality,
                        icon: _isSavingQa
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.verified),
                        label: const Text('Registrar Calidad'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _submitEvidence,
                icon: _isSaving
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check_circle),
                label: Text(
                  _isSaving ? 'Enviando...' : 'Confirmar Entrega',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTrackingCard() {
    final tracking = _tracking;
    final route = (tracking?['route'] as List? ?? []).cast<Map<String, dynamic>>();
    final stops = (tracking?['stops'] as List? ?? []).cast<Map<String, dynamic>>();
    final dest = tracking?['destination'];
    final stats = (tracking?['stats'] as Map<String, dynamic>?) ?? {};
    final progress = (tracking?['progress'] as Map<String, dynamic>?) ?? {};

    final polylinePoints = route
        .map((p) => LatLng(
              ((p['latitude'] as num?)?.toDouble() ?? 0),
              ((p['longitude'] as num?)?.toDouble() ?? 0),
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
          snippet:
              'Duración: ${_formatDuration((s['duration_seconds'] as num?)?.toInt() ?? 0)}',
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
              color: const Color(0xFF2563EB),
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
                    'Seguimiento GPS',
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
                    _trackingEnabled ? 'GPS activado' : 'GPS desactivado',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _trackingEnabled ? Colors.green : Colors.grey,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Switch(
                  value: _trackingEnabled,
                  onChanged: _toggleTracking,
                ),
              ],
            ),
            const SizedBox(height: 8),
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
                _buildStatChip(
                  Icons.route,
                  'Recorrido',
                  '${(stats['distance_traveled_km'] as num? ?? 0).toStringAsFixed(1)} km',
                ),
                _buildStatChip(
                  Icons.flag,
                  'Progreso',
                  '${(progress['percent'] as num? ?? 0).toStringAsFixed(0)}%',
                ),
                _buildStatChip(
                  Icons.near_me,
                  'Restante',
                  progress['remaining_distance_km'] == null
                      ? '—'
                      : '${(progress['remaining_distance_km'] as num).toStringAsFixed(1)} km',
                ),
                _buildStatChip(
                  Icons.pause_circle,
                  'Paradas',
                  '${stats['stops_count'] ?? 0}',
                ),
                _buildStatChip(
                  Icons.hourglass_bottom,
                  'Estacionado',
                  _formatDuration((stats['stationary_time_seconds'] as num?)?.toInt() ?? 0),
                ),
              ],
            ),
            if (stops.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text(
                'Paradas',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
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
                  'Aún no hay puntos GPS registrados para este viaje.',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF2563EB).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF2563EB)),
          const SizedBox(width: 4),
          Text(
            '$label: ',
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
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

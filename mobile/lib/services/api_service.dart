import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _compiledBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://calizalososos-api.onrender.com/api',
  );
  String? _token;

  Future<String> get _baseUrl async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('server_url') ?? _compiledBaseUrl;
  }

  Future<String?> get token async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    return _token;
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await this.token;
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Parsea el cuerpo de error de una respuesta HTTP.
  Map<String, dynamic> _parseErrorResponse(http.Response response) {
    try {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      return {'message': 'Error desconocido'};
    }
  }

  /// Limpia completamente el estado de autenticación.
  Future<void> _clearAuthState() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
    await prefs.remove('user_screens');
  }

  /// Verifica si el token actual es válido. Si no lo es, limpia la sesión.
  Future<bool> isTokenValid() async {
    final tokenValue = await token;
    if (tokenValue == null || tokenValue.isEmpty) return false;
    return true;
  }

  Future<Uri> _url(String path) async {
    final base = await _baseUrl;
    return Uri.parse('$base$path');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http
          .post(
            await _url('auth/login'),
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        _token = data['token'] as String?;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['token']);
        await prefs.setString('user_data', jsonEncode(data['user']));
        await prefs.setStringList('user_screens', (data['screens'] as List? ?? []).cast<String>());
        return data;
      } else if (response.statusCode == 401) {
        await _clearAuthState();
        throw Exception('Credenciales incorrectas');
      } else if (response.statusCode == 500) {
        final errorData = _parseErrorResponse(response);
        final errorMessage = errorData['error'] ?? errorData['message'] ?? 'Error interno del servidor';
        throw Exception(errorMessage);
      } else {
        throw Exception('Error al iniciar sesión (${response.statusCode})');
      }
    } on TimeoutException {
      throw Exception('Tiempo de espera agotado. Verifica tu conexión.');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Error de conexión: $e');
    }
  }

  /// Pantallas (módulos) a los que tiene acceso el usuario autenticado.
  Future<List<String>> getUserScreens() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList('user_screens') ?? const [];
  }

  Future<String?> getUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user_data');
    if (raw == null) return null;
    return jsonDecode(raw)['role'] as String?;
  }

  Future<void> logout() async {
    final headers = await _getHeaders();
    await http.post(
      await _url('auth/logout'),
      headers: headers,
    );
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
    await prefs.remove('user_screens');
  }

  Future<Map<String, dynamic>> getDashboard() async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('dashboard'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al obtener dashboard');
  }

  Future<List<dynamic>> getTrips() async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('trips'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al obtener viajes');
  }

  Future<Map<String, dynamic>> getTrip(String id) async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('trips/$id'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al obtener viaje');
  }

  Future<Map<String, dynamic>> startTrip(String tripId) async {
    final headers = await _getHeaders();
    final response = await http.put(
      await _url('trips/$tripId/start'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al iniciar viaje');
  }

  Future<Map<String, dynamic>> deliverTrip(String tripId) async {
    final headers = await _getHeaders();
    final response = await http.put(
      await _url('trips/$tripId/deliver'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al entregar viaje');
  }

  Future<Map<String, dynamic>> returnTrip(String tripId) async {
    final headers = await _getHeaders();
    final response = await http.put(
      await _url('trips/$tripId/return'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al finalizar viaje');
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.put(
      await _url('auth/profile'),
      headers: headers,
      body: jsonEncode(data),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al actualizar perfil');
  }

  Future<Map<String, dynamic>> updatePassword(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.put(
      await _url('auth/password'),
      headers: headers,
      body: jsonEncode(data),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al actualizar contraseña');
  }

  Future<Map<String, dynamic>> cancelTrip(String tripId) async {
    final headers = await _getHeaders();
    final response = await http.put(
      await _url('trips/$tripId/cancel'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al cancelar viaje');
  }

  // ============ Catálogos ============

  Future<List<dynamic>> getTrucks() async {
    final headers = await _getHeaders();
    final response = await http.get(await _url('trucks'), headers: headers);
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener camiones');
  }

  Future<List<dynamic>> getDrivers() async {
    final headers = await _getHeaders();
    final response = await http.get(await _url('drivers'), headers: headers);
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener conductores');
  }

  Future<List<dynamic>> getClients() async {
    final headers = await _getHeaders();
    final response = await http.get(await _url('clients'), headers: headers);
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener clientes');
  }

  // ============ División política de Panamá ============

  Future<List<dynamic>> getPanamaLocations() async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('panama/locations'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['provincias'] as List? ?? []).cast<dynamic>();
    }
    throw Exception('Error al obtener ubicaciones de Panamá');
  }

  // ============ Proformas de carga ============

  Future<List<dynamic>> getProformas(String date) async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('proformas?date=$date'),
      headers: headers,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener proformas');
  }

  Future<Map<String, dynamic>> createProforma(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('proformas'),
      headers: headers,
      body: jsonEncode(data),
    );
    if (response.statusCode == 201) return jsonDecode(response.body);
    throw Exception(_extractError(response, 'Error al guardar proforma'));
  }

  Future<Map<String, dynamic>> updateProforma(String id, Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.put(
      await _url('proformas/$id'),
      headers: headers,
      body: jsonEncode(data),
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception(_extractError(response, 'Error al actualizar proforma'));
  }

  /// Enviar la ubicación GPS actual de una proforma de cantera en curso.
  Future<void> sendProformaLocation({
    required String proformaId,
    required double latitude,
    required double longitude,
    double? speed,
    double? accuracy,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('proformas/$proformaId/location'),
      headers: headers,
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'accuracy': accuracy,
        'recorded_at': DateTime.now().toIso8601String(),
      }),
    );
    if (response.statusCode != 201) {
      throw Exception('Error al enviar ubicación de cantera');
    }
  }

  /// Obtener la última ubicación registrada de una proforma.
  Future<Map<String, dynamic>> getProformaLocation(String proformaId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('proformas/$proformaId/location'),
      headers: headers,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener ubicación de cantera');
  }

  /// Seguimiento de una proforma: recorrido, paradas, tiempo estacionado y progreso.
  Future<Map<String, dynamic>> getProformaTracking(String proformaId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('proformas/$proformaId/tracking'),
      headers: headers,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener seguimiento de cantera');
  }

  // ============ Controles cantera/planta ============

  Future<List<dynamic>> getControls(Map<String, String> params) async {
    final headers = await _getHeaders();
    final qs = params.entries.map((e) => '${e.key}=${e.value}').join('&');
    final response = await http.get(
      await _url('controls${qs.isEmpty ? '' : '?$qs'}'),
      headers: headers,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener controles');
  }

  Future<Map<String, dynamic>> createControl(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('controls'),
      headers: headers,
      body: jsonEncode(data),
    );
    if (response.statusCode == 201) return jsonDecode(response.body);
    throw Exception(_extractError(response, 'Error al guardar control'));
  }

  // ============ Despachos de producción ============

  Future<List<dynamic>> getDispatches(String date) async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('dispatches?date=$date'),
      headers: headers,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('Error al obtener despachos');
  }

  Future<Map<String, dynamic>> createDispatch(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('dispatches'),
      headers: headers,
      body: jsonEncode(data),
    );
    if (response.statusCode == 201) return jsonDecode(response.body);
    throw Exception(_extractError(response, 'Error al guardar despacho'));
  }

  String _extractError(http.Response response, String fallback) {
    try {
      final data = jsonDecode(response.body);
      if (data['message'] != null) {
        final msg = data['message'];
      if (msg is Map) {
        for (final value in msg.values) {
          if (value is List && value.isNotEmpty) return value.first.toString();
        }
        return fallback;
      }
      return msg.toString();
      }
    } catch (_) {}
    return fallback;
  }

  /// Enviar la ubicación GPS actual de un viaje en curso (telemetría de flota).
  Future<void> sendTripLocation({
    required String tripId,
    required double latitude,
    required double longitude,
    double? speed,
    double? accuracy,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('trips/$tripId/location'),
      headers: headers,
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'accuracy': accuracy,
        'recorded_at': DateTime.now().toIso8601String(),
      }),
    );
    if (response.statusCode != 201) {
      throw Exception('Error al enviar ubicación');
    }
  }

  /// Enviar un lote de ubicaciones almacenadas localmente (modo offline).
  Future<void> sendTripLocationBatch(
    String tripId,
    List<Map<String, dynamic>> locations,
  ) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('trips/$tripId/location'),
      headers: headers,
      body: jsonEncode({
        'locations': locations,
      }),
    );
    if (response.statusCode != 201) {
      throw Exception('Error al enviar lote de ubicaciones');
    }
  }

  /// Obtener la última ubicación registrada de un viaje.
  Future<Map<String, dynamic>> getTripLocation(String tripId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('trips/$tripId/location'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al obtener ubicación');
  }

  /// Seguimiento del viaje: recorrido, paradas, tiempo estacionado y progreso.
  Future<Map<String, dynamic>> getTripTracking(String tripId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      await _url('trips/$tripId/tracking'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al obtener seguimiento del viaje');
  }

  Future<Map<String, dynamic>> uploadEvidence({
    required String tripId,
    required String signatureBase64,
    required double? latitude,
    required double? longitude,
    required List<String> photoBase64,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('trips/$tripId/evidence'),
      headers: headers,
      body: jsonEncode({
        'signature': signatureBase64,
        'latitude': latitude,
        'longitude': longitude,
        'photos': photoBase64,
      }),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al subir evidencia');
  }

  Future<Map<String, dynamic>> recordGross({
    required String tripId,
    required double grossWeight,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('trips/$tripId/gross'),
      headers: headers,
      body: jsonEncode({'gross_weight': grossWeight}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al registrar peso bruto');
  }

  Future<Map<String, dynamic>> recordTare({
    required String tripId,
    required double tareWeight,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('trips/$tripId/tare'),
      headers: headers,
      body: jsonEncode({'tare_weight': tareWeight}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al registrar tara');
  }

  Future<Map<String, dynamic>> recordQuality({
    required String tripId,
    required String qualityStatus,
    String? qualityNotes,
    String? qualityInspector,
    String? batchCode,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      await _url('trips/$tripId/quality'),
      headers: headers,
      body: jsonEncode({
        'quality_status': qualityStatus,
        'quality_notes': qualityNotes,
        'quality_inspector': qualityInspector,
        'batch_code': batchCode,
      }),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al registrar control de calidad');
  }

  Future<Map<String, dynamic>> getFleetLive({double radiusKm = 2}) async {
    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);

    for (var attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        final headers = await _getHeaders();
        final response = await http
            .get(
              await _url('fleet/live?radius_km=$radiusKm'),
              headers: headers,
            )
            .timeout(const Duration(seconds: 15));

        if (response.statusCode == 200) {
          return jsonDecode(response.body) as Map<String, dynamic>;
        } else if (response.statusCode == 401) {
          await _clearAuthState();
          throw Exception('Sesión expirada, vuelve a iniciar sesión');
        } else if (response.statusCode == 500) {
          final errorData = _parseErrorResponse(response);
          final errorMessage = errorData['error'] ?? 'Error interno del servidor';
          if (attempt < maxRetries) {
            await Future.delayed(retryDelay * (attempt + 1));
            continue;
          }
          throw Exception(errorMessage);
        } else {
          throw Exception('Error al obtener flota en vivo (${response.statusCode})');
        }
      } on TimeoutException {
        if (attempt < maxRetries) {
          await Future.delayed(retryDelay * (attempt + 1));
          continue;
        }
        throw Exception('Tiempo de espera agotado al obtener flota');
      } catch (e) {
        if (attempt < maxRetries && e is! Exception) {
          await Future.delayed(retryDelay * (attempt + 1));
          continue;
        }
        rethrow;
      }
    }
    throw Exception('No se pudo obtener la flota en vivo');
  }
}

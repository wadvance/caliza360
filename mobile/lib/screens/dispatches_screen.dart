import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/panama_location_fields.dart';

class DispatchesScreen extends StatefulWidget {
  const DispatchesScreen({super.key});

  @override
  State<DispatchesScreen> createState() => _DispatchesScreenState();
}

class _DispatchesScreenState extends State<DispatchesScreen> {
  final _api = ApiService();
  final _formKey = GlobalKey<FormState>();

  final _destinationController = TextEditingController();
  final _materialController = TextEditingController(text: 'Caliza');
  final _plannedController = TextEditingController();
  final _actualController = TextEditingController();
  final _sacksController = TextEditingController();
  final _responsibleController = TextEditingController();
  final _notesController = TextEditingController();

  List<dynamic> _trucks = [];
  List<dynamic> _drivers = [];
  List<dynamic> _clients = [];
  List<dynamic> _dispatches = [];

  int? _truckId;
  int? _driverId;
  int? _clientId;
  String _status = 'scheduled';
  DateTime _date = DateTime.now();
  DateTime? _departure;

  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _departure = DateTime.now();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final date = _date.toIso8601String().substring(0, 10);
      final results = await Future.wait([
        _api.getTrucks(),
        _api.getDrivers(),
        _api.getClients(),
        _api.getDispatches(date),
      ]);
      if (mounted) {
        setState(() {
          _trucks = results[0];
          _drivers = results[1];
          _clients = results[2];
          _dispatches = results[3];
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar datos: $e')),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_destinationController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona provincia, distrito y corregimiento')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await _api.createDispatch({
        'date': _date.toIso8601String().substring(0, 10),
        'truck_id': _truckId,
        'driver_id': _driverId,
        'client_id': _clientId,
        'destination_name': _destinationController.text.trim(),
        'material_type': _materialController.text.trim(),
        'planned_tons': double.parse(_plannedController.text),
        'actual_tons': double.parse(_actualController.text),
        'sack_count': int.parse(_sacksController.text.isEmpty ? '0' : _sacksController.text),
        'departure_datetime': _departure?.toIso8601String(),
        'status': _status,
        'responsible_person': _responsibleController.text.trim(),
        'notes': _notesController.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Despacho registrado correctamente')),
        );
        _destinationController.clear();
        _plannedController.clear();
        _actualController.clear();
        _sacksController.clear();
        _notesController.clear();
      }
      await _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  InputDecoration _dec(String label, {String? hint}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
    );
  }

  Future<void> _pickDeparture() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _departure ?? _date,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_departure ?? _date),
    );
    if (time == null || !mounted) return;
    setState(() {
      _departure = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Despachos de Producción'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Mercancía que sale de producción',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: const Icon(Icons.calendar_today, color: Color(0xFF2563EB)),
                                title: Text('Fecha: ${_date.day}/${_date.month}/${_date.year}'),
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: _date,
                                    firstDate: DateTime(2020),
                                    lastDate: DateTime(2035),
                                  );
                                  if (picked != null) {
                                    setState(() => _date = picked);
                                    _loadData();
                                  }
                                },
                              ),
                              const SizedBox(height: 8),
                              DropdownButtonFormField<int>(
                                initialValue: _truckId,
                                decoration: _dec('Transporte (camión)'),
                                items: _trucks.map<DropdownMenuItem<int>>((t) {
                                  return DropdownMenuItem(
                                    value: t['id'] as int,
                                    child: Text(t['plate']?.toString() ?? ''),
                                  );
                                }).toList(),
                                onChanged: (v) => setState(() => _truckId = v),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<int>(
                                initialValue: _driverId,
                                decoration: _dec('Camionero'),
                                items: _drivers.map<DropdownMenuItem<int>>((d) {
                                  return DropdownMenuItem(
                                    value: d['id'] as int,
                                    child: Text(d['name']?.toString() ?? ''),
                                  );
                                }).toList(),
                                onChanged: (v) => setState(() => _driverId = v),
                              ),
                              const SizedBox(height: 12),
                              PanamaLocationFields(
                                api: _api,
                                onChanged: (v) => _destinationController.text = v,
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<int>(
                                initialValue: _clientId,
                                decoration: _dec('Punto/Cliente (opcional)'),
                                items: [
                                  const DropdownMenuItem<int>(value: null, child: Text('Sin cliente')),
                                  ..._clients.map<DropdownMenuItem<int>>((c) {
                                    return DropdownMenuItem(
                                      value: c['id'] as int,
                                      child: Text(c['name']?.toString() ?? ''),
                                    );
                                  }),
                                ],
                                onChanged: (v) => setState(() => _clientId = v),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _materialController,
                                decoration: _dec('Material'),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _plannedController,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      decoration: _dec('Toneladas plan', hint: 'Ej. 30'),
                                      validator: (v) {
                                        if (v == null || v.isEmpty) return 'Plan';
                                        return null;
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _actualController,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      decoration: _dec('Toneladas reales', hint: 'Ej. 28.5'),
                                      validator: (v) {
                                        if (v == null || v.isEmpty) return 'Real';
                                        return null;
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _sacksController,
                                keyboardType: TextInputType.number,
                                decoration: _dec('Número de sacos', hint: 'Ej. 140'),
                              ),
                              const SizedBox(height: 12),
                              ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: const Icon(Icons.timelapse, color: Color(0xFF2563EB)),
                                title: Text(
                                  'Salida: ${_departure != null ? '${_departure!.day}/${_departure!.month}/${_departure!.year} ${_departure!.hour.toString().padLeft(2, '0')}:${_departure!.minute.toString().padLeft(2, '0')}' : 'Sin registrar'}',
                                ),
                                trailing: TextButton(
                                  onPressed: _pickDeparture,
                                  child: const Text('Elegir'),
                                ),
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                initialValue: _status,
                                decoration: _dec('Estado'),
                                items: const [
                                  DropdownMenuItem(value: 'scheduled', child: Text('Programado')),
                                  DropdownMenuItem(value: 'in_transit', child: Text('En tránsito')),
                                  DropdownMenuItem(value: 'delivered', child: Text('Entregado')),
                                  DropdownMenuItem(value: 'cancelled', child: Text('Cancelado')),
                                ],
                                onChanged: (v) => setState(() => _status = v ?? 'scheduled'),
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _responsibleController,
                                decoration: _dec('Persona responsable'),
                                validator: (v) => (v == null || v.isEmpty)
                                    ? 'Ingresa el responsable'
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _notesController,
                                maxLines: 2,
                                decoration: _dec('Notas'),
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: ElevatedButton(
                                  onPressed: _saving ? null : _save,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF2563EB),
                                    foregroundColor: Colors.white,
                                  ),
                                  child: _saving
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                          ),
                                        )
                                      : const Text('Guardar Despacho'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Despachos de hoy (${_dispatches.length})',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if (_dispatches.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Center(child: Text('Sin despachos registrados hoy')),
                      )
                    else
                      ..._dispatches.map((d) {
                        final perf = (d['performance_percent'] ?? 0).toDouble();
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.send, color: Color(0xFF2563EB)),
                            title: Text('${d['destination_name']}'),
                            subtitle: Text(
                              '${d['truck']?['plate'] ?? ''} · ${d['actual_tons']} ton (plan ${d['planned_tons']})',
                            ),
                            trailing: Text(
                              '$perf%',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
    );
  }
}

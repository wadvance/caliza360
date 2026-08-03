import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ControlsScreen extends StatefulWidget {
  const ControlsScreen({super.key});

  @override
  State<ControlsScreen> createState() => _ControlsScreenState();
}

class _ControlsScreenState extends State<ControlsScreen> {
  final _api = ApiService();
  final _formKey = GlobalKey<FormState>();

  final _weightController = TextEditingController();
  final _sacksController = TextEditingController();
  final _responsibleController = TextEditingController();
  final _notesController = TextEditingController();

  List<dynamic> _trucks = [];
  List<dynamic> _drivers = [];
  List<dynamic> _controls = [];

  int? _truckId;
  int? _driverId;
  String _location = 'cantera';
  String _controlType = 'salida';
  DateTime _date = DateTime.now();

  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final date = _date.toIso8601String().substring(0, 10);
      final results = await Future.wait([
        _api.getTrucks(),
        _api.getDrivers(),
        _api.getControls({'date': date}),
      ]);
      if (mounted) {
        setState(() {
          _trucks = results[0];
          _drivers = results[1];
          _controls = results[2];
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
    setState(() => _saving = true);
    try {
      await _api.createControl({
        'date': _date.toIso8601String(),
        'location': _location,
        'control_type': _controlType,
        'truck_id': _truckId,
        'driver_id': _driverId,
        'weight_tons': double.parse(_weightController.text),
        'sack_count': int.parse(_sacksController.text.isEmpty ? '0' : _sacksController.text),
        'responsible_person': _responsibleController.text.trim(),
        'notes': _notesController.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Control registrado correctamente')),
        );
        _weightController.clear();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Controles Cantera / Planta'),
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
                      'Registrar entrada/salida y pesaje',
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
                                title: Text(
                                  'Fecha: ${_date.day}/${_date.month}/${_date.year} ${_date.hour.toString().padLeft(2, '0')}:${_date.minute.toString().padLeft(2, '0')}',
                                ),
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
                              Row(
                                children: [
                                  Expanded(
                                    child: SegmentedButton<String>(
                                      segments: const [
                                        ButtonSegment(value: 'cantera', label: Text('Cantera'), icon: Icon(Icons.terrain)),
                                        ButtonSegment(value: 'planta', label: Text('Planta'), icon: Icon(Icons.factory)),
                                      ],
                                      selected: {_location},
                                      onSelectionChanged: (s) =>
                                          setState(() => _location = s.first),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: SegmentedButton<String>(
                                      segments: const [
                                        ButtonSegment(value: 'entrada', label: Text('Entrada'), icon: Icon(Icons.login)),
                                        ButtonSegment(value: 'salida', label: Text('Salida'), icon: Icon(Icons.logout)),
                                      ],
                                      selected: {_controlType},
                                      onSelectionChanged: (s) =>
                                          setState(() => _controlType = s.first),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<int>(
                                initialValue: _truckId,
                                decoration: _dec('Camión'),
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
                              TextFormField(
                                controller: _weightController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: _dec('Peso (toneladas)', hint: 'Ej. 26.3'),
                                validator: (v) {
                                  if (v == null || v.isEmpty) return 'Ingresa el peso';
                                  if (double.tryParse(v) == null) return 'Peso inválido';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _sacksController,
                                keyboardType: TextInputType.number,
                                decoration: _dec('Número de sacos', hint: 'Ej. 130'),
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
                                      : const Text('Guardar Control'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Controles de hoy (${_controls.length})',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if (_controls.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Center(child: Text('Sin controles registrados hoy')),
                      )
                    else
                      ..._controls.map((c) {
                        final loc = c['location'] == 'planta' ? 'Planta' : 'Cantera';
                        final type = c['control_type'] == 'entrada' ? 'Entrada' : 'Salida';
                        return Card(
                          child: ListTile(
                            leading: Icon(
                              c['control_type'] == 'entrada'
                                  ? Icons.login
                                  : Icons.logout,
                              color: c['control_type'] == 'entrada'
                                  ? Colors.green
                                  : Colors.purple,
                            ),
                            title: Text('$loc · $type'),
                            subtitle: Text(
                              '${c['truck']?['plate'] ?? ''} · ${c['weight_tons']} ton · ${c['responsible_person']}',
                            ),
                            trailing: Text(
                              c['control_number']?.toString() ?? '',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
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

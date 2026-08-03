import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/panama_location_fields.dart';
import 'proforma_detail_screen.dart';

class ProformasScreen extends StatefulWidget {
  const ProformasScreen({super.key});

  @override
  State<ProformasScreen> createState() => _ProformasScreenState();
}

class _ProformasScreenState extends State<ProformasScreen> {
  final _api = ApiService();
  final _formKey = GlobalKey<FormState>();

  final _dateController = TextEditingController();
  final _destinationController = TextEditingController();
  final _quarryController = TextEditingController();
  final _materialController = TextEditingController(text: 'Caliza');
  final _weightController = TextEditingController();
  final _sacksController = TextEditingController();
  final _notesController = TextEditingController();

  List<dynamic> _trucks = [];
  List<dynamic> _drivers = [];
  List<dynamic> _clients = [];
  List<dynamic> _proformas = [];

  int? _truckId;
  int? _driverId;
  int? _clientId;

  bool _loadingCatalogs = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _dateController.text = DateTime.now().toIso8601String().substring(0, 10);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loadingCatalogs = true);
    try {
      final results = await Future.wait([
        _api.getTrucks(),
        _api.getDrivers(),
        _api.getClients(),
        _api.getProformas(_dateController.text),
      ]);
      if (mounted) {
        setState(() {
          _trucks = results[0];
          _drivers = results[1];
          _clients = results[2];
          _proformas = results[3];
          _loadingCatalogs = false;
        });
      }
    } catch (e) {
      setState(() => _loadingCatalogs = false);
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
      await _api.createProforma({
        'date': _dateController.text,
        'truck_id': _truckId,
        'driver_id': _driverId,
        'client_id': _clientId,
        'origin_quarry': _quarryController.text.trim(),
        'destination_name': _destinationController.text.trim(),
        'material_type': _materialController.text.trim(),
        'weight_tons': double.parse(_weightController.text),
        'sack_count': int.parse(_sacksController.text.isEmpty ? '0' : _sacksController.text),
        'notes': _notesController.text.trim(),
        'status': 'created',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Proforma registrada correctamente')),
        );
        _destinationController.clear();
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
        title: const Text('Proformas de Carga'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: _loadingCatalogs
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
                      'Registrar carga de cantera',
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
                              TextFormField(
                                controller: _dateController,
                                readOnly: true,
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: DateTime.now(),
                                    firstDate: DateTime(2020),
                                    lastDate: DateTime(2035),
                                  );
                                  if (picked != null) {
                                    setState(() {
                                      _dateController.text =
                                          picked.toIso8601String().substring(0, 10);
                                    });
                                    _loadData();
                                  }
                                },
                                decoration: _dec('Fecha'),
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
                                controller: _quarryController,
                                decoration: _dec('Cantera (origen)', hint: 'Ej. Cantera Cerro Azul'),
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
                              TextFormField(
                                controller: _weightController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: _dec('Toneladas cargadas', hint: 'Ej. 25.5'),
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
                                decoration: _dec('Número de sacos', hint: 'Ej. 120'),
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
                                      : const Text('Guardar Proforma'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Proformas de hoy (${_proformas.length})',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if (_proformas.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Center(child: Text('Sin proformas registradas hoy')),
                      )
                    else
                      ..._proformas.map((p) {
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.inventory, color: Color(0xFFB45309)),
                            title: Text('${p['destination_name']}'),
                            subtitle: Text(
                              '${p['weight_tons']} ton · ${p['sack_count']} sacos · ${p['truck']?['plate'] ?? ''}',
                            ),
                            trailing: Text(
                              p['proforma_number']?.toString() ?? '',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                            onTap: () async {
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ProformaDetailScreen(proforma: Map<String, dynamic>.from(p)),
                                ),
                              );
                              _loadData();
                            },
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

import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// Selector en cascada Provincia → Distrito → Corregimiento de Panamá.
/// Devuelve el nombre completo tipo:
/// "Corregimiento {corregimiento}, Distrito de {distrito}, {provincia}".
class PanamaLocationFields extends StatefulWidget {
  const PanamaLocationFields({
    super.key,
    required this.api,
    required this.onChanged,
    this.initialValue = '',
  });

  final ApiService api;
  final ValueChanged<String> onChanged;
  final String initialValue;

  @override
  State<PanamaLocationFields> createState() => _PanamaLocationFieldsState();
}

class _PanamaLocationFieldsState extends State<PanamaLocationFields> {
  List<dynamic> _provincias = [];
  String? _provincia;
  String? _distrito;
  String? _corregimiento;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final provincias = await widget.api.getPanamaLocations();
      if (mounted) {
        setState(() {
          _provincias = provincias;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar ubicaciones: $e')),
        );
      }
    }
  }

  List<dynamic> get _distritos {
    final p = _provincias.firstWhere((x) => x['nombre'] == _provincia,
        orElse: () => null);
    return (p?['distritos'] as List? ?? []).cast<dynamic>();
  }

  List<dynamic> get _corregimientos {
    final d = _distritos.firstWhere((x) => x['nombre'] == _distrito,
        orElse: () => null);
    return (d?['corregimientos'] as List? ?? []).cast<dynamic>();
  }

  void _notify() {
    if (_corregimiento != null && _corregimiento!.isNotEmpty) {
      widget.onChanged(
        'Corregimiento $_corregimiento, Distrito de $_distrito, $_provincia',
      );
    } else {
      widget.onChanged('');
    }
  }

  InputDecoration _dec(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 8),
        child: Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          initialValue: _provincia,
          decoration: _dec('Provincia'),
          isExpanded: true,
          items: _provincias
              .map<DropdownMenuItem<String>>(
                (p) => DropdownMenuItem(
                  value: p['nombre']?.toString(),
                  child: Text(p['nombre']?.toString() ?? '',
                      overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: (v) => setState(() {
            _provincia = v;
            _distrito = null;
            _corregimiento = null;
            _notify();
          }),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _distrito,
          decoration: _dec('Distrito'),
          isExpanded: true,
          items: _distritos
              .map<DropdownMenuItem<String>>(
                (d) => DropdownMenuItem(
                  value: d['nombre']?.toString(),
                  child: Text(d['nombre']?.toString() ?? '',
                      overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: _provincia == null
              ? null
              : (v) => setState(() {
                    _distrito = v;
                    _corregimiento = null;
                    _notify();
                  }),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _corregimiento,
          decoration: _dec('Corregimiento'),
          isExpanded: true,
          items: _corregimientos
              .map<DropdownMenuItem<String>>(
                (c) => DropdownMenuItem(
                  value: c?.toString(),
                  child: Text(c?.toString() ?? '', overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: _distrito == null
              ? null
              : (v) => setState(() {
                    _corregimiento = v;
                    _notify();
                  }),
        ),
      ],
    );
  }
}

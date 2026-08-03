import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;
  List<String> _screens = [];

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final apiService = ApiService();
      final data = await apiService.getDashboard();
      final screens = await apiService.getUserScreens();
      if (mounted) {
        setState(() {
          _dashboardData = data;
          _screens = screens;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Caliza Los Osos'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboard,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboard,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Resumen del Día',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Summary cards
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.5,
                      children: [
                        _buildSummaryCard(
                          'Viajes',
                          '${_dashboardData?['summary']?['total_trips'] ?? 0}',
                          Icons.local_shipping,
                          Colors.blue,
                        ),
                        _buildSummaryCard(
                          'Toneladas',
                          '${_dashboardData?['summary']?['total_tons'] ?? 0}',
                          Icons.inventory,
                          Colors.green,
                        ),
                        _buildSummaryCard(
                          'Ingresos',
                          '\$${(_dashboardData?['summary']?['total_income'] ?? 0).toStringAsFixed(0)}',
                          Icons.trending_up,
                          Colors.green,
                        ),
                        _buildSummaryCard(
                          'Gastos',
                          '\$${(_dashboardData?['summary']?['total_expenses'] ?? 0).toStringAsFixed(0)}',
                          Icons.trending_down,
                          Colors.red,
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 24),

                    // Operations menu (role based)
                    if (_screens.isNotEmpty) ...[
                      const Text(
                        'Menú de Operación',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_screens.contains('proformas'))
                        _buildModuleCard(
                          'Proformas de Carga',
                          'Registrar carga de cantera a planta',
                          Icons.inventory,
                          const Color(0xFF2563EB),
                          '/proformas',
                        ),
                      if (_screens.contains('controls'))
                        _buildModuleCard(
                          'Controles Cantera/Planta',
                          'Entrada, salida y pesaje',
                          Icons.fact_check_outlined,
                          const Color(0xFF7C3AED),
                          '/controls',
                        ),
                      if (_screens.contains('dispatches'))
                        _buildModuleCard(
                          'Despachos de Producción',
                          'Mercancía que sale de la planta',
                          Icons.send_outlined,
                          const Color(0xFFD97706),
                          '/dispatches',
                        ),
                      const SizedBox(height: 24),
                    ],

                    // Resources section
                    const Text(
                      'Recursos Activos',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _buildResourceRow(
                              'Camiones Activos',
                              '${_dashboardData?['resources']?['active_trucks'] ?? 0}',
                              Icons.local_shipping,
                            ),
                            const Divider(),
                            _buildResourceRow(
                              'Conductores Activos',
                              '${_dashboardData?['resources']?['active_drivers'] ?? 0}',
                              Icons.person,
                            ),
                            const Divider(),
                            _buildResourceRow(
                              'Viajes en Curso',
                              '${_dashboardData?['resources']?['trips_in_progress'] ?? 0}',
                              Icons.route,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
          final routes = ['/dashboard', '/trips'];
          if (_screens.contains('live-map')) {
            routes.add('/live-map');
          }
          routes.addAll(['/profile', '/settings']);
          if (index < routes.length) {
            Navigator.pushNamed(context, routes[index]);
          }
        },
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Inicio',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping),
            label: 'Viajes',
          ),
          if (_screens.contains('live-map'))
            NavigationDestination(
              icon: Icon(Icons.map_outlined),
              selectedIcon: Icon(Icons.map),
              label: 'Mapa',
            ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Ajustes',
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleCard(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    String route,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.15),
          foregroundColor: color,
          child: Icon(icon),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.pushNamed(context, route),
      ),
    );
  }

  Widget _buildResourceRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 14),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

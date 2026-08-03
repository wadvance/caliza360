<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #2563EB; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        .stat-card { background: #f8fafc; border-radius: 8px; padding: 16px; border-left: 4px solid #2563EB; }
        .stat-card.green { border-left-color: #10B981; }
        .stat-card.red { border-left-color: #EF4444; }
        .stat-card.yellow { border-left-color: #F59E0B; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; margin-top: 4px; }
        .section { margin: 20px 0; }
        .section h2 { font-size: 18px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Caliza Los Osos</h1>
            <p>Resumen Diario - {{ $date }}</p>
        </div>

        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Viajes Hoy</div>
                    <div class="stat-value">{{ $trips_today }}</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Completados</div>
                    <div class="stat-value">{{ $trips_completed }}</div>
                </div>
                <div class="stat-card yellow">
                    <div class="stat-label">Toneladas</div>
                    <div class="stat-value">{{ number_format($tons_transported, 1) }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">En Curso</div>
                    <div class="stat-value">{{ $trips_in_progress }}</div>
                </div>
            </div>

            <div class="section">
                <h2>Resumen Financiero</h2>
                <div class="stats-grid">
                    <div class="stat-card green">
                        <div class="stat-label">Ingresos</div>
                        <div class="stat-value">${{ number_format($income, 2) }}</div>
                    </div>
                    <div class="stat-card red">
                        <div class="stat-label">Gastos</div>
                        <div class="stat-value">${{ number_format($expenses, 2) }}</div>
                    </div>
                </div>
                <div class="stat-card" style="margin-top: 12px; border-left-color: {{ $profit >= 0 ? '#10B981' : '#EF4444' }};">
                    <div class="stat-label">Ganancia Neta</div>
                    <div class="stat-value" style="color: {{ $profit >= 0 ? '#10B981' : '#EF4444' }};">
                        ${{ number_format($profit, 2) }}
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Recursos Activos</h2>
                <p><strong>Camiones:</strong> {{ $active_trucks }} | <strong>Conductores:</strong> {{ $active_drivers }}</p>
            </div>
        </div>

        <div class="footer">
            <p>Este es un correo automático del Sistema Integral de Gestión - Caliza Los Osos</p>
            <p>No responder a este correo</p>
        </div>
    </div>
</body>
</html>

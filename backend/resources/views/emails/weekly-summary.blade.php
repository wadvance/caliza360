<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        .stat-card { background: #f8fafc; border-radius: 8px; padding: 16px; border-left: 4px solid #8B5CF6; }
        .stat-card.green { border-left-color: #10B981; }
        .stat-card.red { border-left-color: #EF4444; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; margin-top: 4px; }
        .daily-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .daily-table th, .daily-table td { padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center; }
        .daily-table th { background: #f3f4f6; font-weight: 600; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Caliza Los Osos</h1>
            <p>Resumen Semanal - {{ $period }}</p>
        </div>

        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Viajes</div>
                    <div class="stat-value">{{ $total_trips }}</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Total Toneladas</div>
                    <div class="stat-value">{{ number_format($total_tons, 1) }}</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Ingresos</div>
                    <div class="stat-value">${{ number_format($total_income, 2) }}</div>
                </div>
                <div class="stat-card red">
                    <div class="stat-label">Gastos</div>
                    <div class="stat-value">${{ number_format($total_expenses, 2) }}</div>
                </div>
            </div>

            <h2 style="font-size: 18px; color: #1f2937;">Actividad Diaria</h2>
            <table class="daily-table">
                <thead>
                    <tr>
                        <th>Día</th>
                        <th>Viajes</th>
                        <th>Toneladas</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($daily_data as $day)
                    <tr>
                        <td>{{ $day['day'] }}</td>
                        <td>{{ $day['trips'] }}</td>
                        <td>{{ number_format($day['tons'], 1) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div style="background: {{ $profit >= 0 ? '#f0fdf4' : '#fef2f2' }}; border-radius: 8px; padding: 16px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Ganancia Semanal</p>
                <p style="margin: 4px 0 0; font-size: 28px; font-weight: bold; color: {{ $profit >= 0 ? '#16a34a' : '#dc2626' }};">
                    ${{ number_format($profit, 2) }}
                </p>
            </div>
        </div>

        <div class="footer">
            <p>Este es un correo automático del Sistema Integral de Gestión - Caliza Los Osos</p>
        </div>
    </div>
</body>
</html>

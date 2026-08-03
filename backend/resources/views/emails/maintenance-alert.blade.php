<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .alert-item { background: #fffbeb; border-left: 4px solid #F59E0B; padding: 12px; margin: 8px 0; border-radius: 4px; }
        .alert-item.critical { background: #fef2f2; border-left-color: #EF4444; }
        .alert-item h3 { margin: 0 0 4px; color: #1f2937; }
        .alert-item p { margin: 2px 0; color: #6b7280; font-size: 14px; }
        .severity-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .severity-critical { background: #FEE2E2; color: #DC2626; }
        .severity-high { background: #FEF3C7; color: #D97706; }
        .severity-medium { background: #FEF9C3; color: #CA8A04; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Caliza Los Osos</h1>
            <p>Alerta de Mantenimiento Pendiente</p>
        </div>

        <div class="content">
            <p style="color: #6b7280;">Los siguientes camiones requieren mantenimiento:</p>

            @foreach($alerts as $alert)
            <div class="alert-item {{ $alert['severity'] === 'critical' ? 'critical' : '' }}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>{{ $alert['truck_plate'] }}</h3>
                    <span class="severity-badge severity-{{ $alert['severity'] }}">{{ $alert['severity'] }}</span>
                </div>
                <p><strong>{{ $alert['message'] }}</strong></p>
                <p>Km restantes: {{ number_format($alert['km_until_service']) }} | Fecha estimada: {{ $alert['estimated_date'] }}</p>
                @if(isset($alert['recommended_actions']))
                <p style="margin-top: 8px;">
                    @foreach($alert['recommended_actions'] as $action)
                        • {{ $action }}<br>
                    @endforeach
                </p>
                @endif
            </div>
            @endforeach
        </div>

        <div class="footer">
            <p>Este es un correo automático del Sistema Integral de Gestión - Caliza Los Osos</p>
        </div>
    </div>
</body>
</html>

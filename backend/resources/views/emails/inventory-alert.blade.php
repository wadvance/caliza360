<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .alert-item { background: #fef2f2; border-left: 4px solid #EF4444; padding: 12px; margin: 8px 0; border-radius: 4px; }
        .alert-item h3 { margin: 0 0 4px; color: #1f2937; }
        .alert-item p { margin: 0; color: #6b7280; font-size: 14px; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Caliza Los Osos</h1>
            <p>Alerta de Inventario Bajo</p>
        </div>

        <div class="content">
            <p style="color: #6b7280;">Los siguientes productos están por debajo del stock mínimo:</p>

            @foreach($items as $item)
            <div class="alert-item">
                <h3>{{ $item->name }}</h3>
                <p>Stock actual: <strong>{{ $item->quantity }} {{ $item->unit }}</strong> | Mínimo: {{ $item->min_stock }} {{ $item->unit }}</p>
            </div>
            @endforeach

            <p style="margin-top: 20px; padding: 12px; background: #fff7ed; border-radius: 4px; color: #c2410c;">
                <strong>Acción requerida:</strong> Realizar pedido de reabastecimiento para evitar interrupciones en operaciones.
            </p>
        </div>

        <div class="footer">
            <p>Este es un correo automático del Sistema Integral de Gestión - Caliza Los Osos</p>
        </div>
    </div>
</body>
</html>

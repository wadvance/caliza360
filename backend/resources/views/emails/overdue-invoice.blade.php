<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th, .invoice-table td { padding: 10px; border: 1px solid #e5e7eb; text-align: left; }
        .invoice-table th { background: #f3f4f6; font-weight: 600; }
        .total-row { background: #fef2f2; font-weight: bold; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Caliza Los Osos</h1>
            <p>Facturas Vencidas</p>
        </div>

        <div class="content">
            <p style="color: #6b7280;">Se han encontrado las siguientes facturas vencidas que requieren atención:</p>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Vencimiento</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    @php $grandTotal = 0; @endphp
                    @foreach($invoices as $invoice)
                    <tr>
                        <td>{{ $invoice->invoice_number }}</td>
                        <td>{{ $invoice->client->name ?? 'N/A' }}</td>
                        <td>{{ $invoice->issue_date }}</td>
                        <td style="color: #DC2626; font-weight: bold;">{{ $invoice->due_date }}</td>
                        <td>${{ number_format($invoice->total, 2) }}</td>
                    </tr>
                    @php $grandTotal += $invoice->total; @endphp
                    @endforeach
                    <tr class="total-row">
                        <td colspan="4">Total por Cobrar</td>
                        <td>${{ number_format($grandTotal, 2) }}</td>
                    </tr>
                </tbody>
            </table>

            <p style="margin-top: 20px; padding: 12px; background: #fef2f2; border-radius: 4px; color: #DC2626;">
                <strong>Acción requerida:</strong> Contactar a los clientes para gestionar el cobro de las facturas vencidas.
            </p>
        </div>

        <div class="footer">
            <p>Este es un correo automático del Sistema Integral de Gestión - Caliza Los Osos</p>
        </div>
    </div>
</body>
</html>

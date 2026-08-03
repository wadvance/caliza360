# Caliza360 — Crear Cloud SQL (MySQL) y cargar los datos de SQLite
# Requiere: gcloud CLI instalado y logueado.
#
# Uso:
#   .\setup-cloudsql.ps1                 # crea instancia + base + usuario
#   .\setup-cloudsql.ps1 -MigrateData   # ademas copia datos de SQLite a MySQL

param(
  [switch]$MigrateData,
  [string]$Region = "us-central1",
  [string]$ProjectId = "caliza360"
)

$ErrorActionPreference = "Stop"

Write-Host "`n[1/4] Creando instancia MySQL caliza360-mysql..." -ForegroundColor Cyan
gcloud sql instances describe caliza360-mysql --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud sql instances create caliza360-mysql `
    --tier=db-f1-micro `
    --region=$Region `
    --project=$ProjectId `
    --database-version=MYSQL_8_0
} else {
  Write-Host "  Instancia ya existe." -ForegroundColor Yellow
}

Write-Host "`n[2/4] Creando base de datos caliza360..." -ForegroundColor Cyan
gcloud sql databases create caliza360 --instance=caliza360-mysql --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Base ya existe." -ForegroundColor Yellow }

Write-Host "`n[3/4] Creando usuario caliza360..." -ForegroundColor Cyan
if (-not $env:DB_PASSWORD) {
  $env:DB_PASSWORD = Read-Host -Prompt "  Password para el usuario caliza360" -AsSecureString | ForEach-Object { [System.Net.NetworkCredential]::new("", $_).Password }
}
gcloud sql users create caliza360 --instance=caliza360-mysql --password=$env:DB_PASSWORD --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  gcloud sql users set-password caliza360 --instance=caliza360-mysql --password=$env:DB_PASSWORD --project $ProjectId
}

Write-Host "`n[4/4] Mostrando conexion y variables necesarias:" -ForegroundColor Cyan
$instance = gcloud sql instances describe caliza360-mysql --project $ProjectId --format="value(ipAddresses[0].ipAddress,connectionName)" 2>$null
Write-Host "  IP publica:      $($instance[0])"
Write-Host "  Nombre conexion: $($instance[1])"
Write-Host "  Exporta estas variables antes de desplegar:"
Write-Host "    \$env:DB_PASSWORD = '<password>'"
Write-Host "    \$env:APP_KEY = '<llave laravel>'"

if ($MigrateData) {
  Write-Host "`nMigrando datos desde SQLite a MySQL..." -ForegroundColor Yellow
  $env:DB_CONNECTION = "sqlite"
  $env:DB_DATABASE = "C:\CALIZA 360\backend\database\database.sqlite"
  Push-Location "C:\CALIZA 360\backend"
  php artisan migrate --force
  Pop-Location
  Write-Host "  Nota: revisa las migraciones. Los datos historicos de SQLite deben exportarse manualmente."
}

Write-Host "`n=== LISTO ===" -ForegroundColor Green

# Caliza360 — Despliegue a Firebase Hosting + Cloud Run
# Requiere: Docker Desktop, gcloud CLI, firebase CLI ya instalados y logueados.
#
# Uso:
#   .\deploy.ps1                  # despliega frontend + backend (Cloud Run + Cloud SQL)
#   .\deploy.ps1 -FrontendOnly   # solo actualiza el frontend en Firebase Hosting
#   .\deploy.ps1 -BackendOnly    # solo actualiza el backend en Cloud Run

param(
  [switch]$FrontendOnly,
  [switch]$BackendOnly,
  [string]$Region = "us-central1",
  [string]$ProjectId = "caliza360"
)

$ErrorActionPreference = "Stop"

function CheckCommand {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: '$Name' no esta instalado." -ForegroundColor Red
    exit 1
  }
}

if (-not $FrontendOnly) { CheckCommand "docker" }
if (-not $FrontendOnly) { CheckCommand "gcloud" }
CheckCommand "firebase"

$Root = "C:\CALIZA 360"

if (-not $BackendOnly) {
  Write-Host "`n[1/3] Construyendo frontend..." -ForegroundColor Cyan
  Push-Location "$Root\web"
  npm run build
  Pop-Location
}

if (-not $FrontendOnly) {
  $SERVICE = "caliza360-backend"
  $IMAGE = "${Region}-docker.pkg.dev/${ProjectId}/cloud-run-source-deploy/${SERVICE}"

  Write-Host "`n[2/3] Desplegando backend a Cloud Run..." -ForegroundColor Cyan
  Write-Host "  (Asegurate de tener creada la instancia MySQL llamada 'caliza360-mysql')"

  gcloud auth configure-docker $Region-docker.pkg.dev --quiet
  gcloud builds submit "$Root\backend" --region $Region --tag $IMAGE --project $ProjectId
  gcloud run deploy $SERVICE `
    --image $IMAGE `
    --platform managed `
    --region $Region `
    --project $ProjectId `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --timeout 300 `
    --min-instances 0 `
    --max-instances 2 `
    --add-cloudsql-instances "${ProjectId}:${Region}:caliza360-mysql" `
    --set-env-vars "DB_CONNECTION=mysql,DB_HOST=/cloudsql/${ProjectId}:${Region}:caliza360-mysql,DB_DATABASE=caliza360,DB_USERNAME=caliza360,DB_PASSWORD=${env:DB_PASSWORD}" `
    --set-env-vars "APP_KEY=${env:APP_KEY},APP_ENV=production,APP_DEBUG=false,APP_URL=https://${ProjectId}.web.app" `
    --set-env-vars "SESSION_DRIVER=database,QUEUE_CONNECTION=database,CACHE_STORE=database" `
    --set-env-vars "FIREBASE_PROJECT_ID=${ProjectId},FIREBASE_SERVICE_ACCOUNT=storage/app/service-account.json"
}

Write-Host "`n[3/3] Desplegando frontend a Firebase Hosting..." -ForegroundColor Cyan
Push-Location "$Root\web"
firebase deploy --only hosting
Pop-Location

Write-Host "`n=== LISTO ===" -ForegroundColor Green
Write-Host "Web:    https://${ProjectId}.web.app"
Write-Host "API:    https://${SERVICE}-${Region}-${ProjectId}.run.app"

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $repoRoot "frontend"

if (-not (Test-Path (Join-Path $repoRoot "venv\Scripts\Activate.ps1"))) {
    Write-Error "Python venv nicht gefunden unter venv\\Scripts\\Activate.ps1"
}

if (-not (Test-Path (Join-Path $frontendPath "package.json"))) {
    Write-Error "Frontend nicht gefunden unter frontend\\package.json"
}

Write-Host "Starte Backend (FastAPI) in neuem Terminal..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$repoRoot'; .\venv\Scripts\Activate.ps1; uvicorn api.server:app --reload --host 127.0.0.1 --port 8000"
)

Write-Host "Starte Frontend (Vite) in neuem Terminal..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendPath'; npm run dev"
)

Write-Host "Beide Dienste werden gestartet."
Write-Host "Backend: http://127.0.0.1:8000/health"
Write-Host "Frontend: siehe Port-Ausgabe im Frontend-Terminal (meist http://localhost:5173 oder 5174)"

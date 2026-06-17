# Configura android/local.properties y verifica componentes del SDK para compilar con Gradle.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/setup-android-sdk.ps1

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent

$defaultSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk -or -not (Test-Path $sdk)) { $sdk = $defaultSdk }

if (-not (Test-Path $sdk)) {
    Write-Host "No se encontró el Android SDK en:" -ForegroundColor Red
    Write-Host "  $defaultSdk"
    Write-Host ""
    Write-Host "Instalá Android Studio y, en SDK Manager, instalá:"
    Write-Host "  - Android SDK Platform 34"
    Write-Host "  - Android SDK Build-Tools 34.0.0"
    exit 1
}

$escaped = $sdk -replace '\\', '\\'
$localProps = Join-Path $projectRoot 'android\local.properties'
@(
    '## Ruta local del SDK (no commitear; ver android/.gitignore)',
    "sdk.dir=$escaped",
    ''
) | Set-Content -Path $localProps -Encoding ASCII

Write-Host "OK: android/local.properties -> $sdk" -ForegroundColor Green

function Test-Platform($api) {
    $jar = Join-Path $sdk "platforms\android-$api\android.jar"
    return Test-Path $jar
}

$missing = @()
if (-not (Test-Platform 34)) { $missing += 'platforms;android-34' }
$lambdaStubs = Join-Path $sdk 'build-tools\34.0.0\core-lambda-stubs.jar'
if (-not (Test-Path $lambdaStubs)) { $missing += 'build-tools;34.0.0' }

if ($missing.Count -eq 0) {
    Write-Host "OK: Platform 34 y Build-Tools 34.0.0 presentes." -ForegroundColor Green
    Write-Host ""
    Write-Host "Compilá con: npx expo run:android"
    exit 0
}

Write-Host ""
Write-Host "Faltan o están incompletos componentes del SDK:" -ForegroundColor Yellow
foreach ($m in $missing) { Write-Host "  - $m" }

$sdkmanager = Join-Path $sdk 'cmdline-tools\latest\bin\sdkmanager.bat'
if (Test-Path $sdkmanager) {
    Write-Host ""
    Write-Host "Instalando con sdkmanager (aceptá licencias si pregunta)..." -ForegroundColor Cyan
    & $sdkmanager --sdk_root=$sdk $missing
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Listo. Ejecutá: npx expo run:android" -ForegroundColor Green
        exit 0
    }
}

Write-Host ""
Write-Host "Instalalos desde Android Studio:" -ForegroundColor Cyan
Write-Host "  Settings -> Languages & Frameworks -> Android SDK -> SDK Platforms"
Write-Host "    [x] Android 14.0 (UpsideDownCake) - API Level 34"
Write-Host "  Pestaña SDK Tools:"
Write-Host "    [x] Android SDK Build-Tools 34"
Write-Host "    [x] Android SDK Command-line Tools (latest)"
Write-Host ""
Write-Host "Si la carpeta platforms\android-34 existe pero falla el build, desmarcá API 34,"
Write-Host "aplicá cambios, volvé a marcarlo y Apply (reinstala android.jar)."
Write-Host ""
Write-Host 'Variable de entorno recomendada (PowerShell como usuario):'
Write-Host "  [Environment]::SetEnvironmentVariable('ANDROID_HOME', '$sdk', 'User')"
exit 1

# Sincroniza iconos de Expo desde assets/icon.png (1024x1024) y splash desde brand/logotipo.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/sync-brand-assets.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$assets = Join-Path $root 'assets'
$brand = Join-Path $root 'assets\brand'
$icon = Join-Path $assets 'icon.png'
$logo = Join-Path $brand 'Logotipewhitemode.png'
$iso = Join-Path $brand 'Isotipewhitemode.png'

if (Test-Path $iso) {
    Copy-Item $iso (Join-Path $assets 'icon.master.png') -Force
    Write-Host 'OK: icon.master.png <- isotipo brand (solo launcher)' -ForegroundColor Green
} elseif (-not (Test-Path (Join-Path $assets 'icon.master.png'))) {
    if (Test-Path $icon) {
        Copy-Item $icon (Join-Path $assets 'icon.master.png') -Force
    } else {
        Write-Error 'No hay assets/brand/Isotipewhitemode.png ni icon.png'
    }
}

& (Join-Path $PSScriptRoot 'pad-app-icon.ps1')

if (Test-Path $logo) {
    Copy-Item $logo (Join-Path $assets 'splash.png') -Force
    Write-Host 'OK: splash <- logotipo (brand)' -ForegroundColor Green
} else {
    Write-Host 'Aviso: sin Logotipewhitemode.png, splash.png no se actualizo' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Regenera iconos nativos: npm run prebuild:android' -ForegroundColor Cyan
Write-Host 'Instala en el dispositivo: npx expo run:android' -ForegroundColor Cyan

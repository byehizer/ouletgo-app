# Escala el isotipo al "safe zone" de Android/iOS (centro ~66%) para adaptive icon.
# Lee assets/icon.png (1024x1024 maestro) y genera icon + adaptive-icon con margen.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/pad-app-icon.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$assets = Join-Path $root 'assets'
$master = Join-Path $assets 'icon.master.png'
$current = Join-Path $assets 'icon.png'

if (-not (Test-Path $master)) {
    if (Test-Path $current) {
        Copy-Item $current $master -Force
        Write-Host 'Copia de seguridad: icon.master.png (original 1024)' -ForegroundColor DarkGray
    } else {
        Write-Error "No existe $current ni $master"
    }
}

$source = $master

# 66/108 dp = zona segura oficial de adaptive icon (Google)
$canvasSize = 1024
$safeScale = 0.62

$src = [System.Drawing.Image]::FromFile($source)
try {
    $canvas = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $maxSide = [int][Math]::Floor($canvasSize * $safeScale)
    $ratio = [Math]::Min($maxSide / $src.Width, $maxSide / $src.Height)
    $drawW = [int][Math]::Round($src.Width * $ratio)
    $drawH = [int][Math]::Round($src.Height * $ratio)
    $x = [int][Math]::Round(($canvasSize - $drawW) / 2)
    $y = [int][Math]::Round(($canvasSize - $drawH) / 2)

    $graphics.DrawImage($src, $x, $y, $drawW, $drawH)
    $graphics.Dispose()

    $outIcon = Join-Path $root 'assets\icon.png'
    $outAdaptive = Join-Path $root 'assets\adaptive-icon.png'
    $outFavicon = Join-Path $root 'assets\favicon.png'
    $outNotif = Join-Path $root 'assets\notification-icon.png'

    $canvas.Save($outIcon, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Save($outAdaptive, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Save($outFavicon, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Save($outNotif, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()

    Write-Host "OK: icono centrado al ${safeScale}x ($drawW x $drawH px dentro de ${canvasSize}x${canvasSize})" -ForegroundColor Green
    Write-Host "     -> icon.png, adaptive-icon.png, favicon.png, notification-icon.png"
}
finally {
    $src.Dispose()
}

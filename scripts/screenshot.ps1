# Script para tirar screenshot via ADB
# Uso: .\scripts\screenshot.ps1 [nome-do-arquivo]

param(
    [string]$filename = "screenshot-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
)

Write-Host "📸 Tirando screenshot..." -ForegroundColor Cyan

# Verificar se o dispositivo está conectado
$devices = adb devices | Select-String -Pattern "device$"
if (-not $devices) {
    Write-Host "❌ Nenhum dispositivo Android conectado!" -ForegroundColor Red
    Write-Host "💡 Certifique-se de:" -ForegroundColor Yellow
    Write-Host "   1. Dispositivo conectado via USB" -ForegroundColor Yellow
    Write-Host "   2. Depuração USB habilitada" -ForegroundColor Yellow
    Write-Host "   3. Autorizar depuração USB no dispositivo" -ForegroundColor Yellow
    exit 1
}

# Tirar screenshot
Write-Host "📱 Capturando tela do dispositivo..." -ForegroundColor Cyan
adb exec-out screencap -p > $filename

if (Test-Path $filename) {
    $fileSize = (Get-Item $filename).Length
    if ($fileSize -gt 0) {
        Write-Host "✅ Screenshot salvo: $filename" -ForegroundColor Green
        Write-Host "📁 Tamanho: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Gray
        
        # Tentar abrir a imagem
        $open = Read-Host "Abrir imagem? (S/N)"
        if ($open -eq "S" -or $open -eq "s") {
            Start-Process $filename
        }
    } else {
        Write-Host "❌ Erro: Arquivo vazio" -ForegroundColor Red
        Remove-Item $filename -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "❌ Erro ao salvar screenshot" -ForegroundColor Red
}





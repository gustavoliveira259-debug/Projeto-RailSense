# Sobe um broker MQTT para a ESP32 sem Docker e sem administrador.
# Uso: powershell -ExecutionPolicy Bypass -File hardware\broker-local.ps1
#
# Lê MQTT_SERVER e MQTT_PORT de include/secrets.h, confere se o IP ainda é deste PC
# e roda o mosquitto.exe instalado escutando em todas as interfaces.

$ErrorActionPreference = 'Stop'
$secrets = Join-Path $PSScriptRoot 'include\secrets.h'

if (-not (Test-Path $secrets)) {
    Write-Host "Falta $secrets. Copie include\secrets.example.h para include\secrets.h e preencha." -ForegroundColor Red
    exit 1
}

$conteudo = Get-Content $secrets -Raw
$servidor = [regex]::Match($conteudo, '#define\s+MQTT_SERVER\s+"([^"]+)"').Groups[1].Value
$porta = [regex]::Match($conteudo, '#define\s+MQTT_PORT\s+(\d+)').Groups[1].Value

# IPs que a ESP32 pode alcançar (ignora loopback, link-local, VirtualBox e WSL/Docker).
$ips = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.|192\.168\.56\.|172\.)' } |
    Select-Object -ExpandProperty IPAddress

Write-Host "IPs deste PC: $($ips -join ', ')"
Write-Host "secrets.h:    MQTT_SERVER=$servidor  MQTT_PORT=$porta"

if ($ips -notcontains $servidor) {
    Write-Host ""
    Write-Host "ATENCAO: o IP $servidor do secrets.h nao e mais deste PC. A ESP32 nao vai conectar." -ForegroundColor Yellow
    Write-Host "Troque MQTT_SERVER em hardware\include\secrets.h para um dos IPs acima e grave de novo:" -ForegroundColor Yellow
    Write-Host "  python -m platformio run -d hardware -t upload" -ForegroundColor Yellow
    Write-Host ""
}

if (Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "Ja existe algo escutando na porta $porta (broker ja rodando?). Nada a fazer." -ForegroundColor Cyan
    exit 0
}

$mosquitto = 'C:\Program Files\mosquitto\mosquitto.exe'
if (-not (Test-Path $mosquitto)) {
    Write-Host "mosquitto.exe nao encontrado em $mosquitto. Instale o Mosquitto ou use o docker compose." -ForegroundColor Red
    exit 1
}

$conf = Join-Path $env:TEMP "railsense-mosquitto-$porta.conf"
@"
listener $porta 0.0.0.0
allow_anonymous true
log_dest stdout
"@ | Set-Content -Path $conf -Encoding ascii

Write-Host "Broker escutando em 0.0.0.0:$porta. Deixe esta janela aberta (Ctrl+C encerra)." -ForegroundColor Green
& $mosquitto -c $conf -v

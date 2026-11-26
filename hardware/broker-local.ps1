# Sobe um broker MQTT para a ESP32 sem Docker e sem administrador.
# Uso: powershell -ExecutionPolicy Bypass -File hardware\broker-local.ps1
#
# Lê MQTT_SERVER e MQTT_PORT de include/secrets.h, confere se o IP ainda é deste PC
# e roda o mosquitto.exe instalado escutando em todas as interfaces, sem acesso anônimo:
# mesmas senhas do .env da raiz (MQTT_*_SENHA) e mesmas permissões de broker/acl do Docker.

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

$raiz = Split-Path $PSScriptRoot -Parent
$envRaiz = Join-Path $raiz '.env'
$acl = Join-Path $raiz 'broker\acl'
$senhas = @{}
if (Test-Path $envRaiz) {
    foreach ($linha in Get-Content $envRaiz) {
        if ($linha -match '^\s*(MQTT_(ESP32|BACKEND|CAMERA)_SENHA)\s*=\s*(.*)$') { $senhas[$Matches[1]] = $Matches[3].Trim() }
    }
}
foreach ($var in 'MQTT_ESP32_SENHA', 'MQTT_BACKEND_SENHA', 'MQTT_CAMERA_SENHA') {
    if (-not $senhas[$var]) {
        Write-Host "Defina $var em $envRaiz (veja .env.example). Sem senha o broker nao sobe." -ForegroundColor Red
        exit 1
    }
}

$passwd = Join-Path $env:TEMP "railsense-mosquitto-$porta.passwd"
$mosquittoPasswd = Join-Path (Split-Path $mosquitto) 'mosquitto_passwd.exe'
Remove-Item $passwd -ErrorAction SilentlyContinue
& $mosquittoPasswd -c -b $passwd esp32 $senhas['MQTT_ESP32_SENHA']
& $mosquittoPasswd -b $passwd backend $senhas['MQTT_BACKEND_SENHA']
& $mosquittoPasswd -b $passwd camera $senhas['MQTT_CAMERA_SENHA']

$conf = Join-Path $env:TEMP "railsense-mosquitto-$porta.conf"
@"
listener $porta 0.0.0.0
allow_anonymous false
password_file $passwd
acl_file $acl
log_dest stdout
"@ | Set-Content -Path $conf -Encoding ascii

Write-Host "Broker escutando em 0.0.0.0:$porta. Deixe esta janela aberta (Ctrl+C encerra)." -ForegroundColor Green
& $mosquitto -c $conf -v

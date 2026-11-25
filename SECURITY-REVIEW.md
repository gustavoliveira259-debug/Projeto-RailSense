# Revisao de seguranca — Railsense

## Escopo

Analise estatica das configuracoes Docker Compose, backend, broker MQTT e ponte
de camera. O firmware e a validacao com ESP32/celular IPCam foram excluidos. Os
achados abaixo descrevem riscos em uma demonstracao acessivel pela rede; o
impacto e menor quando os servicos ficam restritos ao computador local.

## Resumo dos achados

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟡 MEDIUM | `broker/mosquitto.conf`, `docker-compose.yml` | `mosquitto.conf:1-3`; `docker-compose.yml:47-48` | Broker MQTT aceita conexoes anonimas e a porta 1883 e publicada em todas as interfaces; clientes alcancaveis podem injetar leituras e comandos de captura. | 9/10 |
| 2 | 🟡 MEDIUM | `docker-compose.yml`, `backend/src/main/resources/application.yml` | `docker-compose.yml:37,40-48`; `application.yml:57-62` | Cadastro publico fica habilitado por padrao no Compose; qualquer cliente que alcance o backend pode criar uma conta ENGENHEIRO, autorizada a ler a API de monitoramento. | 9/10 |

## Detalhes e recomendacoes

### 1. Broker MQTT anonimo e exposto

`broker/mosquitto.conf` permite conexoes anonimas, e o Compose publica a porta
1883 sem restringir o endereco de escuta do host. O backend consome mensagens
de vibracao em `backend/src/main/java/br/com/railsense_backend/mqtt/VibracaoMqttListener.java`;
a ponte de camera subscreve ao topico de captura em
`camera/camera_bridge.py`. Assim, um cliente com acesso ao broker pode enviar
leituras falsas ou disparar capturas.

**Acao para o TCC agora:** sem os dispositivos conectados, nao publique a porta
1883 no host. Se o broker for necessario para o backend no Compose, ele pode
continuar acessivel internamente pela rede Docker. Se a demonstracao nao usar
MQTT, desative a integracao nesse ambiente.

**Antes de conectar dispositivos ou compartilhar o broker:** configurar
autenticacao e ACLs por topico; usar TLS se o trafego sair do host/rede local.

### 2. Cadastro publico habilitado no Compose

O Compose usa `REGISTRATION_ENABLED=true` quando a variavel nao e informada.
O endpoint de cadastro e publico (`AuthController.java:84-115`) e cria contas
com papel `ENGENHEIRO`; `SecurityConfig.java:58-70` permite que esse papel leia
rotas `/api/**`. A configuracao de Render ja desativa o cadastro publico.

**Acao para o TCC agora:** em demonstracao numa rede compartilhada, definir
`REGISTRATION_ENABLED=false` e criar contas de teste controladas. Manter o
cadastro aberto apenas se for deliberado e a demonstracao estiver restrita ao
computador local.

## Controles adicionais antes de uma demonstracao em rede

- Vincular as portas publicadas do PostgreSQL, backend, broker e frontend a
  `127.0.0.1` quando nao precisarem ser acessadas por outros dispositivos.
- Nao reutilizar o fallback local `admin/12345678` de
  `backend/src/main/resources/application.yml` fora do desenvolvimento local;
  definir credenciais unicas por variaveis de ambiente.
- Manter `SESSION_COOKIE_SECURE=false` somente para testes locais por HTTP; em
  acesso HTTPS, habilitar o atributo `Secure`. O blueprint de Render ja o faz.

## Limites

Esta revisao e estatica. Nao foram testados fluxos com hardware, implantacoes
reais, exposicao efetiva de portas, nem comportamento operacional do broker ou
da camera. As configuracoes de producao podem diferir das configuracoes locais.

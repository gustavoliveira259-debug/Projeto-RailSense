package br.com.railsense_backend.mqtt;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.IMqttToken;
import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import br.com.railsense_backend.service.LeituraService;
import jakarta.annotation.PreDestroy;
import tools.jackson.databind.ObjectMapper;

/**
 * Assina os tópicos dos sensores e grava as leituras. Ligado por app.mqtt.enabled.
 *
 * O broker pode subir depois do backend: a primeira conexão é tentada em segundo plano
 * até dar certo, e depois o Paho reconecta sozinho (reassinando em connectComplete).
 */
@Component
@ConditionalOnProperty(name = "app.mqtt.enabled", havingValue = "true")
public class MqttLeituraListener implements MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(MqttLeituraListener.class);
    private static final long ESPERA_RECONEXAO_MS = 5_000;

    private final LeituraService leituraService;
    private final ObjectMapper mapper;
    private final String url;
    private final String topico;
    private final String usuario;
    private final String senha;

    /** Dispositivos desconhecidos já avisados no log, para não repetir o aviso a cada segundo. */
    private final Set<String> desconhecidosAvisados = ConcurrentHashMap.newKeySet();

    private volatile boolean encerrando;
    private MqttAsyncClient client;

    public MqttLeituraListener(LeituraService leituraService, ObjectMapper mapper,
            @Value("${app.mqtt.url}") String url,
            @Value("${app.mqtt.topic}") String topico,
            @Value("${app.mqtt.username:}") String usuario,
            @Value("${app.mqtt.password:}") String senha) {
        this.leituraService = leituraService;
        this.mapper = mapper;
        this.url = url;
        this.topico = topico;
        this.usuario = usuario;
        this.senha = senha;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void iniciar() throws MqttException {
        client = new MqttAsyncClient(url, "railsense-backend-" + UUID.randomUUID(), new MemoryPersistence());
        client.setCallback(this);
        Thread conector = new Thread(this::conectarComRetentativa, "mqtt-conector");
        conector.setDaemon(true);
        conector.start();
    }

    private void conectarComRetentativa() {
        MqttConnectOptions opcoes = new MqttConnectOptions();
        opcoes.setAutomaticReconnect(true);
        opcoes.setCleanSession(true);
        if (!usuario.isBlank()) {
            opcoes.setUserName(usuario);
            opcoes.setPassword(senha.toCharArray());
        }
        while (!encerrando) {
            try {
                client.connect(opcoes).waitForCompletion();
                return;
            } catch (MqttException e) {
                log.warn("MQTT indisponível em {} ({}). Nova tentativa em {} s.", url, e.getMessage(),
                    ESPERA_RECONEXAO_MS / 1000);
                try {
                    Thread.sleep(ESPERA_RECONEXAO_MS);
                } catch (InterruptedException interrompido) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        try {
            // Sem esperar o SUBACK: bloquear a thread de callback do Paho trava o cliente.
            log.info("MQTT conectado a {}; assinando {}.", serverURI, topico);
            client.subscribe(topico, 0, null, new IMqttActionListener() {
                @Override
                public void onSuccess(IMqttToken token) {
                    log.info("Assinatura de {} confirmada pelo broker.", topico);
                }

                @Override
                public void onFailure(IMqttToken token, Throwable e) {
                    log.error("Broker recusou a assinatura de {}: {}", topico, e != null ? e.getMessage() : "sem detalhe");
                }
            });
        } catch (MqttException e) {
            log.error("Falha ao assinar {}: {}", topico, e.getMessage());
        }
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        // Uma exceção aqui derruba a conexão com o broker: tudo é tratado localmente.
        try {
            MensagemSensor.interpretar(topic, message.getPayload(), mapper).ifPresentOrElse(
                m -> {
                    boolean gravada = leituraService.registrar(m.device(), m.tipo(), m.valor(), Instant.now());
                    if (!gravada && desconhecidosAvisados.add(m.device() + "/" + m.tipo())) {
                        log.warn("Leituras de \"{}\" ({}) ignoradas: sensor não cadastrado ou desativado.",
                            m.device(), m.tipo());
                    }
                },
                () -> log.debug("Mensagem MQTT inválida em {}: {}", topic, abreviar(message.getPayload())));
        } catch (RuntimeException e) {
            log.error("Erro ao gravar leitura de {}: {}", topic, e.getMessage());
        }
    }

    private static String abreviar(byte[] payload) {
        String texto = new String(payload, java.nio.charset.StandardCharsets.UTF_8);
        return texto.length() > 120 ? texto.substring(0, 120) + "..." : texto;
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("Conexão MQTT perdida: {}. Reconectando...", cause != null ? cause.getMessage() : "sem detalhe");
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Só assina; não publica nada.
    }

    @PreDestroy
    public void encerrar() {
        encerrando = true;
        if (client == null) {
            return;
        }
        try {
            if (client.isConnected()) {
                client.disconnect().waitForCompletion(2_000);
            }
            client.close();
        } catch (MqttException e) {
            log.debug("Erro ao fechar cliente MQTT: {}", e.getMessage());
        }
    }
}

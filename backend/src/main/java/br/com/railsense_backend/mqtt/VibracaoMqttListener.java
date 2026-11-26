package br.com.railsense_backend.mqtt;

import java.util.UUID;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.com.railsense_backend.service.VibracaoService;
import jakarta.annotation.PreDestroy;

/**
 * Assina railsense/sensor/vibracao e grava cada leitura no eixo do sensor.
 * Só existe quando app.mqtt.broker-url está definido (o deploy no Render não tem broker).
 * A conexão é refeita pelo agendamento abaixo, inclusive se o broker subir depois do backend.
 */
@Component
@ConditionalOnExpression("!'${app.mqtt.broker-url:}'.isBlank()")
public class VibracaoMqttListener implements MqttCallback {

    private static final Logger log = LoggerFactory.getLogger(VibracaoMqttListener.class);

    private final MqttClient client;
    private final String brokerUrl;
    private final String topico;
    private final String usuario;
    private final String senha;
    private final VibracaoMensagemParser parser;
    private final VibracaoService vibracao;
    /** Evita repetir o aviso a cada tentativa enquanto o broker estiver fora. */
    private boolean falhaAvisada;

    public VibracaoMqttListener(VibracaoMensagemParser parser, VibracaoService vibracao,
            @Value("${app.mqtt.broker-url}") String brokerUrl,
            @Value("${app.mqtt.topico-vibracao:railsense/sensor/vibracao}") String topico,
            @Value("${app.mqtt.usuario:}") String usuario,
            @Value("${app.mqtt.senha:}") String senha) throws MqttException {
        this.parser = parser;
        this.vibracao = vibracao;
        this.brokerUrl = brokerUrl;
        this.topico = topico;
        this.usuario = usuario;
        this.senha = senha;
        // ID único: duas instâncias com o mesmo ID se derrubariam no broker.
        this.client = new MqttClient(brokerUrl, "railsense-backend-" + UUID.randomUUID(), new MemoryPersistence());
        this.client.setCallback(this);
    }

    @Scheduled(initialDelay = 0, fixedDelayString = "${app.mqtt.reconexao-ms:10000}")
    public synchronized void garantirConexao() {
        if (client.isConnected()) {
            return;
        }
        var opcoes = new MqttConnectOptions();
        opcoes.setCleanSession(true);
        opcoes.setConnectionTimeout(5);
        opcoes.setAutomaticReconnect(false);
        if (!usuario.isBlank()) {
            opcoes.setUserName(usuario);
            opcoes.setPassword(senha.toCharArray());
        }
        try {
            client.connect(opcoes);
            client.subscribe(topico, 0);
            falhaAvisada = false;
            log.info("MQTT conectado em {}, assinando {}", brokerUrl, topico);
        } catch (MqttException e) {
            if (!falhaAvisada) {
                log.warn("Sem conexão com o broker MQTT {} ({}); tentando de novo em segundo plano", brokerUrl, e.getMessage());
                falhaAvisada = true;
            }
        }
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        // Uma exceção aqui derrubaria a conexão do Paho: mensagem ruim é só descartada.
        try {
            parser.ler(message.getPayload()).ifPresentOrElse(
                m -> vibracao.registrar(m.device(), m.valor()),
                () -> log.debug("Mensagem de vibração inválida descartada"));
        } catch (RuntimeException e) {
            log.warn("Falha ao gravar leitura de vibração: {}", e.getMessage());
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("Conexão MQTT perdida ({}); reconectando", cause.getMessage());
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Só assinamos; nada é publicado.
    }

    @PreDestroy
    public void fechar() {
        try {
            if (client.isConnected()) {
                client.disconnect();
            }
            client.close();
        } catch (MqttException e) {
            log.debug("Erro ao fechar o cliente MQTT: {}", e.getMessage());
        }
    }
}

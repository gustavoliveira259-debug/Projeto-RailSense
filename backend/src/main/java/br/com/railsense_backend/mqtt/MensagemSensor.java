package br.com.railsense_backend.mqtt;

import java.util.Locale;
import java.util.Optional;

import br.com.railsense_backend.enums.TipoSensor;
import tools.jackson.databind.ObjectMapper;

/**
 * Mensagem publicada pelo dispositivo em railsense/sensor/{tipo}, com corpo
 * {"device":"esp32-01","valor":2048}. O tipo vem do último segmento do tópico.
 */
public record MensagemSensor(String device, TipoSensor tipo, double valor) {

    record Corpo(String device, Double valor) {}

    /** Vazio se o tópico não for de um tipo conhecido ou o corpo não tiver device e valor numérico. */
    public static Optional<MensagemSensor> interpretar(String topico, byte[] corpo, ObjectMapper mapper) {
        TipoSensor tipo = tipoDoTopico(topico);
        if (tipo == null || corpo == null || corpo.length == 0 || corpo.length > 1024) {
            return Optional.empty();
        }
        try {
            Corpo lido = mapper.readValue(corpo, Corpo.class);
            if (lido == null || lido.device() == null || lido.device().isBlank()
                    || lido.valor() == null || !Double.isFinite(lido.valor())) {
                return Optional.empty();
            }
            return Optional.of(new MensagemSensor(lido.device().trim(), tipo, lido.valor()));
        } catch (RuntimeException e) {
            return Optional.empty();
        }
    }

    static TipoSensor tipoDoTopico(String topico) {
        if (topico == null) {
            return null;
        }
        String ultimo = topico.substring(topico.lastIndexOf('/') + 1).toLowerCase(Locale.ROOT);
        return switch (ultimo) {
            case "vibracao" -> TipoSensor.VIBRACAO;
            case "temperatura" -> TipoSensor.TEMPERATURA;
            default -> null;
        };
    }
}

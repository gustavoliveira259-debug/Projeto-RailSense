package br.com.railsense_backend.mqtt;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/** Lê o JSON publicado pelo ESP32: {"device":"esp32-01","valor":2048}. */
@Component
public class VibracaoMensagemParser {

    /** Mesmo formato aceito em EixoRequest.sensorDispositivo. */
    private static final Pattern DISPOSITIVO = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    private final ObjectMapper objectMapper;

    public VibracaoMensagemParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Optional<Mensagem> ler(byte[] payload) {
        try {
            Mensagem m = objectMapper.readValue(new String(payload, StandardCharsets.UTF_8), Mensagem.class);
            if (m == null || m.device() == null || !DISPOSITIVO.matcher(m.device()).matches()
                    || m.valor() == null || m.valor() < 0) {
                return Optional.empty();
            }
            return Optional.of(m);
        } catch (JacksonException e) {
            return Optional.empty();
        }
    }

    public record Mensagem(String device, Integer valor) {}
}

package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EixoRequest(
    @NotNull Long vagaoId,
    @NotNull Integer posicao,
    @NotBlank String identificadorUnico,
    // Sensor de vibração do eixo (campo "device" do ESP32, ex.: esp32-01); vazio desvincula.
    // Espaços nas pontas são aceitos e removidos em sensorDispositivoNormalizado().
    @Size(max = 64)
    @Pattern(regexp = "\\s*[A-Za-z0-9._-]*\\s*", message = "use só letras, números, ponto, hífen ou sublinhado")
    String sensorDispositivo
) {
    /** Texto vazio vira null, para a coluna UNIQUE aceitar vários eixos sem sensor. */
    public String sensorDispositivoNormalizado() {
        return sensorDispositivo == null || sensorDispositivo.isBlank() ? null : sensorDispositivo.trim();
    }
}

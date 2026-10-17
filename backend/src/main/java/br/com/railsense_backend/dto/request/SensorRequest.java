package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.TipoSensor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** codigo = valor do campo "device" que o dispositivo publica no MQTT. */
public record SensorRequest(
    @NotBlank @Size(max = 100) String codigo,
    @NotNull TipoSensor tipo,
    @NotNull Long eixoId
) {}

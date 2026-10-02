package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EixoRequest(
    @NotNull Long vagaoId,
    @NotNull Integer posicao,
    @NotBlank String identificadorUnico
) {}
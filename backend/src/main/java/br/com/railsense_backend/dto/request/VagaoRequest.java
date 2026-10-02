package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VagaoRequest(
    @NotBlank String numeroUk,
    String tipo,
    @NotNull Long patioLinhaId
) {}
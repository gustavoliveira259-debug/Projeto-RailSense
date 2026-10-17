package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EixoRequest(
    @NotNull Long vagaoId,
    @NotNull @Min(1) Integer posicao,
    @NotBlank @Size(max = 100) String identificadorUnico
) {}

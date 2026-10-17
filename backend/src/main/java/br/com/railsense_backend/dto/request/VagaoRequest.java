package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** O pátio/linha é opcional: a posição na composição vem do trem. */
public record VagaoRequest(
    @NotBlank @Size(max = 50) String numeroUk,
    @Size(max = 100) String tipo,
    @NotNull Long tremId,
    Long patioLinhaId
) {}

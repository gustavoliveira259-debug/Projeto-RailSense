package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.TipoPatioLinha;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PatioLinhaRequest(
    @NotBlank String nome,
    @NotNull TipoPatioLinha tipo
) {}
package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.Papel;
import jakarta.validation.constraints.NotNull;

public record PapelRequest(@NotNull Papel papel) {}

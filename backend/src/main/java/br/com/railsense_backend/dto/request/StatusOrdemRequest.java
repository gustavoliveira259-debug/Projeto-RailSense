package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.StatusOrdem;
import jakarta.validation.constraints.NotNull;

public record StatusOrdemRequest(@NotNull StatusOrdem status) {}

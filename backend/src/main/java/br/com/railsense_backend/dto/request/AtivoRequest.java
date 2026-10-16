package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record AtivoRequest(@NotNull Boolean ativo) {}

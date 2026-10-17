package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TremRequest(
    @NotBlank @Size(max = 50) String codigo,
    @Size(max = 255) String nome
) {}

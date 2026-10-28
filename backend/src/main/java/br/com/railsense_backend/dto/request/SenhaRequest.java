package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Nova senha definida pelo ADMIN (mesma regra de tamanho do cadastro). */
public record SenhaRequest(@NotBlank @Size(min = 12, max = 256) String password) {}

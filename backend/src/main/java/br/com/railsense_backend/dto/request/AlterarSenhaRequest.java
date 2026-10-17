package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequest(
    @NotBlank @Size(max = 256) String senhaAtual,
    @NotBlank @Size(min = 12, max = 256) String novaSenha
) {}

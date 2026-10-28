package br.com.railsense_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Dados cadastrais editados pelo ADMIN; papel, senha e ativo têm endpoints próprios. */
public record AtualizarUsuarioRequest(
    @NotBlank @Size(min = 2, max = 255) String nome,
    @NotBlank @Email @Size(max = 255) String email
) {}

package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.Papel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Mesmas regras de nome, e-mail e senha do cadastro público (RegistrationRequest). */
public record CriarUsuarioRequest(
    @NotBlank @Size(min = 2, max = 255) String nome,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 12, max = 256) String password,
    @NotNull Papel papel
) {}

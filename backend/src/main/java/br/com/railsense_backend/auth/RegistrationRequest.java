package br.com.railsense_backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
    @NotBlank @Size(min = 2, max = 255) String nome,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 12, max = 256) String password
) {}

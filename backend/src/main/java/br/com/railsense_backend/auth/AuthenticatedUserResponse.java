package br.com.railsense_backend.auth;

import br.com.railsense_backend.models.Usuario;

public record AuthenticatedUserResponse(Long id, String nome, String email, String papel) {
    static AuthenticatedUserResponse from(Usuario usuario) {
        return new AuthenticatedUserResponse(usuario.getId(), usuario.getNome(),
            usuario.getEmail(), usuario.getPapel().name());
    }
}

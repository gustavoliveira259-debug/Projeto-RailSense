package br.com.railsense_backend.dto.response;

import java.time.Instant;

import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.models.Usuario;

public record UsuarioResponse(
    Long id,
    String nome,
    String email,
    Papel papel,
    boolean ativo,
    Instant criadoEm
) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getPapel(), u.isAtivo(), u.getCriadoEm());
    }
}

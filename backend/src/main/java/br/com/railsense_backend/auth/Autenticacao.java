package br.com.railsense_backend.auth;

import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import br.com.railsense_backend.models.Usuario;

/** Monta a autenticação da sessão: principal = id do usuário, uma authority ROLE_<papel>. */
public final class Autenticacao {

    private Autenticacao() {}

    public static Authentication de(Usuario usuario) {
        return UsernamePasswordAuthenticationToken.authenticated(usuario.getId(), null,
            List.of(new SimpleGrantedAuthority(role(usuario))));
    }

    static String role(Usuario usuario) {
        return "ROLE_" + usuario.getPapel().name();
    }
}

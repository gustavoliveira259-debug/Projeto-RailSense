package br.com.railsense_backend.auth;

import java.io.IOException;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * O papel fica gravado na sessão no login. Este filtro relê o usuário a cada requisição para
 * que uma troca de papel ou desativação feita pelo ADMIN valha imediatamente, sem novo login.
 * Não é um @Component de propósito: senão o Spring Boot também o registraria como filtro de servlet.
 */
public class SessaoAtualizadaFilter extends OncePerRequestFilter {

    private final UsuarioRepository usuarios;
    private final SecurityContextRepository securityContextRepository;

    public SessaoAtualizadaFilter(UsuarioRepository usuarios, SecurityContextRepository securityContextRepository) {
        this.usuarios = usuarios;
        this.securityContextRepository = securityContextRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication atual = SecurityContextHolder.getContext().getAuthentication();
        if (atual != null && atual.getPrincipal() instanceof Long usuarioId) {
            Optional<Usuario> usuario = usuarios.findById(usuarioId).filter(Usuario::isAtivo);
            if (usuario.isEmpty()) {
                // Desativado ou removido: encerra a sessão; a requisição segue como anônima (401).
                SecurityContextHolder.clearContext();
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }
            } else if (!temSomente(atual, Autenticacao.role(usuario.get()))) {
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(Autenticacao.de(usuario.get()));
                SecurityContextHolder.setContext(context);
                securityContextRepository.saveContext(context, request, response);
            }
        }
        chain.doFilter(request, response);
    }

    private static boolean temSomente(Authentication auth, String role) {
        return auth.getAuthorities().size() == 1
            && role.equals(auth.getAuthorities().iterator().next().getAuthority());
    }
}

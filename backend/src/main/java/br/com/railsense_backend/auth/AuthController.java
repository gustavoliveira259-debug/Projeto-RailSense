package br.com.railsense_backend.auth;

import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // Mantém tempo de resposta semelhante quando o e-mail não existe.
    private static final String DUMMY_HASH = "$2a$12$0kCrCGAnCQdYl5ZwmCzkmuP2dO.FqI70eNe2efYdnFQGxHB25F48G";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;
    private final LoginAttemptService attempts;

    public AuthController(UsuarioRepository usuarios, PasswordEncoder passwordEncoder,
            SecurityContextRepository securityContextRepository, LoginAttemptService attempts) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.securityContextRepository = securityContextRepository;
        this.attempts = attempts;
    }

    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken token) {
        return token;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String email = request.email().trim().toLowerCase();
        String attemptKey = clientAddress(httpRequest) + ":" + email;
        if (attempts.isBlocked(attemptKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ApiError("Tente novamente mais tarde."));
        }

        Usuario usuario = usuarios.findByEmailIgnoreCase(email).orElse(null);
        boolean validPassword = passwordEncoder.matches(request.password(),
            usuario == null ? DUMMY_HASH : usuario.getHashSenha());
        if (usuario == null || !usuario.isAtivo() || !validPassword) {
            attempts.recordFailure(attemptKey);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("Credenciais inválidas."));
        }
        attempts.clear(attemptKey);

        httpRequest.getSession();
        httpRequest.changeSessionId();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(usuario.getId(), null,
            List.of(() -> "ROLE_" + usuario.getPapel().name()));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        return ResponseEntity.ok(AuthenticatedUserResponse.from(usuario));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request,
            HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String email = request.email().trim().toLowerCase();
        String registrationKey = clientAddress(httpRequest) + ":register";
        if (attempts.isBlocked(registrationKey) || usuarios.findByEmailIgnoreCase(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("Não foi possível concluir o cadastro."));
        }

        Usuario usuario = usuarios.save(Usuario.builder()
            .nome(request.nome().trim())
            .email(email)
            .hashSenha(passwordEncoder.encode(request.password()))
            .papel(Papel.ENGENHEIRO)
            .ativo(true)
            .build());
        // Limita criação massiva de contas por origem a cinco por quinze minutos.
        attempts.recordFailure(registrationKey);

        httpRequest.getSession();
        httpRequest.changeSessionId();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(usuario.getId(), null,
            List.of(() -> "ROLE_" + usuario.getPapel().name()));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthenticatedUserResponse.from(usuario));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication authentication) {
        Long usuarioId = (Long) authentication.getPrincipal();
        return usuarios.findById(usuarioId).filter(Usuario::isAtivo)
            .<ResponseEntity<?>>map(usuario -> ResponseEntity.ok(AuthenticatedUserResponse.from(usuario)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("Sessão inválida.")));
    }

    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",", 2)[0].trim();
    }

    private record ApiError(String message) {}
}

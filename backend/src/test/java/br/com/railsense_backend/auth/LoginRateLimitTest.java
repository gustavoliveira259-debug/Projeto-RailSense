package br.com.railsense_backend.auth;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import br.com.railsense_backend.config.SecurityConfig;
import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.UsuarioRepository;
import br.com.railsense_backend.service.UsuarioService;

/** Limite de tentativas de login: 5 falhas em 15 minutos bloqueiam o e-mail com 429. */
@WebMvcTest(controllers = AuthController.class,
    properties = "app.security.cors.allowed-origins=http://localhost:5173")
@Import({SecurityConfig.class, LoginAttemptService.class})
// O contador de tentativas fica em memória: cada teste começa com um contexto novo.
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LoginRateLimitTest {

    private static final String EMAIL = "engenheiro@railsense.com";
    private static final String SENHA = "senha-correta-123";

    @Autowired MockMvc mvc;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean UsuarioRepository usuarios;
    @MockitoBean UsuarioService usuarioService;

    @BeforeEach
    void setUp() {
        Usuario usuario = Usuario.builder()
            .nome("Engenheiro Teste")
            .email(EMAIL)
            .hashSenha(passwordEncoder.encode(SENHA))
            .papel(Papel.ENGENHEIRO)
            .ativo(true)
            .build();
        usuario.setId(1L);
        when(usuarios.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(usuarios.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(usuario));
        when(usuarios.findById(1L)).thenReturn(Optional.of(usuario));
    }

    @Test
    void sextaTentativaDoMesmoIpEhBloqueadaCom429() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(login(EMAIL, "senha-errada", "10.0.0.1")).andExpect(status().isUnauthorized());
        }
        mvc.perform(login(EMAIL, SENHA, "10.0.0.1")).andExpect(status().isTooManyRequests());
    }

    @Test
    void trocarOXForwardedForNaoContornaOBloqueio() throws Exception {
        for (int i = 1; i <= 5; i++) {
            mvc.perform(login(EMAIL, "senha-errada", "198.51.100." + i)).andExpect(status().isUnauthorized());
        }
        // Novo IP e senha correta: o e-mail continua bloqueado.
        mvc.perform(login(EMAIL, SENHA, "198.51.100.99")).andExpect(status().isTooManyRequests());
    }

    @Test
    void bloqueioDeUmEmailNaoAfetaOutraConta() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(login("outro@railsense.com", "senha-errada", "10.0.0.2")).andExpect(status().isUnauthorized());
        }
        mvc.perform(login(EMAIL, SENHA, "10.0.0.2")).andExpect(status().isOk());
    }

    @Test
    void loginCorretoZeraAsFalhasAnteriores() throws Exception {
        for (int i = 0; i < 4; i++) {
            mvc.perform(login(EMAIL, "senha-errada", "10.0.0.3")).andExpect(status().isUnauthorized());
        }
        mvc.perform(login(EMAIL, SENHA, "10.0.0.3")).andExpect(status().isOk());
        for (int i = 0; i < 4; i++) {
            mvc.perform(login(EMAIL, "senha-errada", "10.0.0.3")).andExpect(status().isUnauthorized());
        }
        mvc.perform(login(EMAIL, SENHA, "10.0.0.3")).andExpect(status().isOk());
    }

    private static MockHttpServletRequestBuilder login(String email, String senha, String ip) {
        return post("/api/auth/login").with(csrf())
            .header("X-Forwarded-For", ip)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + senha + "\"}");
    }
}

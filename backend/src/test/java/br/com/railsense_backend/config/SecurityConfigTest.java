package br.com.railsense_backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;

import br.com.railsense_backend.controller.EixoController;
import br.com.railsense_backend.controller.UsuarioController;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.repository.AnaliseRepository;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.ImagemRepository;
import br.com.railsense_backend.repository.UsuarioRepository;
import br.com.railsense_backend.repository.VagaoRepository;
import br.com.railsense_backend.service.UsuarioService;

/**
 * Regras de acesso: ADMIN só gerencia contas; GESTOR administra o monitoramento (cadastros, alertas,
 * ordens); ENGENHEIRO visualiza, envia fotos e atende ordens.
 */
@WebMvcTest(controllers = {EixoController.class, UsuarioController.class},
    properties = "app.security.cors.allowed-origins=http://localhost:5173")
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired MockMvc mvc;

    @MockitoBean EixoRepository eixos;
    @MockitoBean VagaoRepository vagoes;
    @MockitoBean ImagemRepository imagens;
    @MockitoBean AnaliseRepository analises;
    @MockitoBean UsuarioRepository usuarios;
    @MockitoBean UsuarioService usuarioService;

    @BeforeEach
    void setUp() {
        when(eixos.findAll(any(Pageable.class))).thenReturn(Page.empty());
        when(usuarioService.listar(any())).thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0));
    }

    @Test
    void anonimoRecebe401() throws Exception {
        mvc.perform(get("/api/eixos")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ENGENHEIRO")
    void engenheiroAcessaMonitoramento() throws Exception {
        mvc.perform(get("/api/eixos")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ENGENHEIRO")
    void engenheiroNaoGerenciaUsuarios() throws Exception {
        mvc.perform(get("/api/usuarios")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminGerenciaUsuarios() throws Exception {
        mvc.perform(get("/api/usuarios")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminNaoAcessaMonitoramento() throws Exception {
        mvc.perform(get("/api/eixos")).andExpect(status().isForbidden());
        mvc.perform(patch("/api/eixos/1/ativo").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":false}"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "GESTOR")
    void escritaSemCsrfEhRecusada() throws Exception {
        mvc.perform(patch("/api/eixos/1/ativo")
                .contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":false}"))
            .andExpect(status().isForbidden());
    }

    /** Passou pela segurança: o controller pode responder 200/404/400, mas não 401/403. */
    private static ResultMatcher liberado() {
        return result -> assertThat(result.getResponse().getStatus()).isNotIn(401, 403);
    }

    @Test
    @WithMockUser(roles = "GESTOR")
    void gestorVisualizaEAlteraCadastros() throws Exception {
        mvc.perform(get("/api/eixos")).andExpect(status().isOk());
        mvc.perform(patch("/api/eixos/1/ativo").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":false}"))
            .andExpect(liberado());
        mvc.perform(post("/api/vagoes").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(liberado());
    }

    @Test
    @WithMockUser(roles = "GESTOR")
    void gestorNaoGerenciaUsuarios() throws Exception {
        mvc.perform(get("/api/usuarios")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ENGENHEIRO")
    void engenheiroNaoAlteraCadastrosNemDecideAlertas() throws Exception {
        mvc.perform(patch("/api/eixos/1/ativo").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":false}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/vagoes").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/alertas/1/decisao").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/ordens").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        mvc.perform(patch("/api/imagens/1/baseline").with(csrf()))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ENGENHEIRO")
    void engenheiroEnviaFotosEAtendeOrdens() throws Exception {
        mvc.perform(post("/api/imagens").with(csrf())).andExpect(liberado());
        mvc.perform(patch("/api/ordens/1/status").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONCLUIDA\"}"))
            .andExpect(liberado());
    }
}

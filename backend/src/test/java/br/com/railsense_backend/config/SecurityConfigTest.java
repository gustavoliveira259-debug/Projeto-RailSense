package br.com.railsense_backend.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

import br.com.railsense_backend.controller.EixoController;
import br.com.railsense_backend.controller.UsuarioController;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.repository.AnaliseRepository;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.ImagemRepository;
import br.com.railsense_backend.repository.UsuarioRepository;
import br.com.railsense_backend.repository.VagaoRepository;
import br.com.railsense_backend.service.UsuarioService;

/** Regras de acesso: ADMIN só gerencia contas; ENGENHEIRO opera o monitoramento. */
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
    @WithMockUser(roles = "ENGENHEIRO")
    void escritaSemCsrfEhRecusada() throws Exception {
        mvc.perform(patch("/api/eixos/1/ativo")
                .contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":false}"))
            .andExpect(status().isForbidden());
    }
}

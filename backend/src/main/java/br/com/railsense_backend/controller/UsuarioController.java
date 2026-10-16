package br.com.railsense_backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.request.AtivoRequest;
import br.com.railsense_backend.dto.request.CriarUsuarioRequest;
import br.com.railsense_backend.dto.request.PapelRequest;
import br.com.railsense_backend.dto.response.UsuarioResponse;
import br.com.railsense_backend.service.UsuarioService;
import jakarta.validation.Valid;

/** Gestão de usuários. Acesso restrito ao ADMIN em SecurityConfig. */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return service.listar();
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> criar(@Valid @RequestBody CriarUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @PatchMapping("/{id}/papel")
    public UsuarioResponse alterarPapel(@PathVariable Long id, @Valid @RequestBody PapelRequest request,
            @AuthenticationPrincipal Long adminId) {
        return service.alterarPapel(id, request.papel(), adminId);
    }

    @PatchMapping("/{id}/ativo")
    public UsuarioResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request,
            @AuthenticationPrincipal Long adminId) {
        return service.alterarAtivo(id, request.ativo(), adminId);
    }
}

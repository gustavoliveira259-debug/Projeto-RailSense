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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.request.OrdemManutencaoRequest;
import br.com.railsense_backend.dto.request.StatusOrdemRequest;
import br.com.railsense_backend.dto.response.OrdemManutencaoResponse;
import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.service.OrdemManutencaoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ordens")
public class OrdemManutencaoController {

    private final OrdemManutencaoService service;

    public OrdemManutencaoController(OrdemManutencaoService service) {
        this.service = service;
    }

    @GetMapping
    public List<OrdemManutencaoResponse> listar(@RequestParam(required = false) StatusOrdem status) {
        return service.listar(status);
    }

    @PostMapping
    public ResponseEntity<OrdemManutencaoResponse> criar(@Valid @RequestBody OrdemManutencaoRequest request,
            @AuthenticationPrincipal Long usuarioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request, usuarioId));
    }

    @PatchMapping("/{id}/status")
    public OrdemManutencaoResponse atualizarStatus(@PathVariable Long id,
            @Valid @RequestBody StatusOrdemRequest request) {
        return service.atualizarStatus(id, request.status());
    }
}

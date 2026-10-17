package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.DecisaoAlertaRequest;
import br.com.railsense_backend.dto.response.AlertaDetalheResponse;
import br.com.railsense_backend.dto.response.AlertaResponse;
import br.com.railsense_backend.dto.response.DecisaoAlertaResponse;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.service.AlertaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

    private final AlertaService alertaService;

    public AlertaController(AlertaService alertaService) {
        this.alertaService = alertaService;
    }

    /** Mais recentes primeiro. Filtros opcionais por status e por eixo. */
    @GetMapping
    public List<AlertaResponse> listar(@RequestParam(required = false) StatusAlerta status,
            @RequestParam(required = false) Long eixoId) {
        return alertaService.listar(status, eixoId);
    }

    @GetMapping("/{id}")
    public AlertaDetalheResponse detalhar(@PathVariable Long id) {
        return alertaService.detalhar(id);
    }

    /** O principal da sessão é o id do usuário (ver AuthController). */
    @PostMapping("/{id}/decisao")
    public ResponseEntity<DecisaoAlertaResponse> decidir(@PathVariable Long id,
            @Valid @RequestBody DecisaoAlertaRequest request,
            @AuthenticationPrincipal Long usuarioId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertaService.decidir(id, usuarioId, request));
    }

    /** Encerra um alerta confirmado (vazamento tratado). */
    @PostMapping("/{id}/fechar")
    public AlertaResponse fechar(@PathVariable Long id) {
        return alertaService.fechar(id);
    }
}

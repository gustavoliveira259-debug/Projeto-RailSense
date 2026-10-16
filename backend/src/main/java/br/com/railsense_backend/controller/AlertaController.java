package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.DecisaoAlertaRequest;
import br.com.railsense_backend.dto.response.AlertaDetalheResponse;
import br.com.railsense_backend.dto.response.AlertaResponse;
import br.com.railsense_backend.dto.response.DecisaoAlertaResponse;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.repository.AlertaRepository;
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

    private final AlertaRepository alertas;
    private final AlertaService alertaService;

    public AlertaController(AlertaRepository alertas, AlertaService alertaService) {
        this.alertas = alertas;
        this.alertaService = alertaService;
    }

    @GetMapping
    public List<AlertaResponse> listar(@RequestParam(required = false) StatusAlerta status) {
        var lista = status != null ? alertas.findByStatus(status) : alertas.findAll();
        return lista.stream()
            .map(a -> new AlertaResponse(a.getId(), a.getNivel(), a.getStatus(), a.getScore(),
                a.getEixo().getId(), a.getEixo().getIdentificadorUnico(), a.getCriadoEm()))
            .toList();
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
}

package br.com.railsense_backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.request.AtivoRequest;
import br.com.railsense_backend.dto.request.TremRequest;
import br.com.railsense_backend.dto.response.TremResponse;
import br.com.railsense_backend.service.EstruturaService;
import br.com.railsense_backend.service.MonitoramentoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trens")
public class TremController {

    private final MonitoramentoService monitoramento;
    private final EstruturaService estrutura;

    public TremController(MonitoramentoService monitoramento, EstruturaService estrutura) {
        this.monitoramento = monitoramento;
        this.estrutura = estrutura;
    }

    @GetMapping
    public List<TremResponse> listar() {
        return monitoramento.listarTrens();
    }

    @GetMapping("/{id}")
    public TremResponse detalhar(@PathVariable Long id) {
        return monitoramento.buscarTrem(id);
    }

    @PostMapping
    public ResponseEntity<TremResponse> criar(@Valid @RequestBody TremRequest request) {
        Long id = estrutura.criarTrem(request).getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoramento.buscarTrem(id));
    }

    @PatchMapping("/{id}/ativo")
    public TremResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request) {
        estrutura.alterarAtivoTrem(id, request.ativo());
        return monitoramento.buscarTrem(id);
    }
}

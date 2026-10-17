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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.request.AtivoRequest;
import br.com.railsense_backend.dto.request.VagaoRequest;
import br.com.railsense_backend.dto.response.VagaoResponse;
import br.com.railsense_backend.service.EstruturaService;
import br.com.railsense_backend.service.MonitoramentoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vagoes")
public class VagaoController {

    private final MonitoramentoService monitoramento;
    private final EstruturaService estrutura;

    public VagaoController(MonitoramentoService monitoramento, EstruturaService estrutura) {
        this.monitoramento = monitoramento;
        this.estrutura = estrutura;
    }

    @GetMapping
    public List<VagaoResponse> listar(@RequestParam(required = false) Long tremId) {
        return monitoramento.listarVagoes(tremId);
    }

    @GetMapping("/{id}")
    public VagaoResponse detalhar(@PathVariable Long id) {
        return monitoramento.buscarVagao(id);
    }

    @PostMapping
    public ResponseEntity<VagaoResponse> criar(@Valid @RequestBody VagaoRequest request) {
        Long id = estrutura.criarVagao(request).getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoramento.buscarVagao(id));
    }

    @PatchMapping("/{id}/ativo")
    public VagaoResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request) {
        estrutura.alterarAtivoVagao(id, request.ativo());
        return monitoramento.buscarVagao(id);
    }
}

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
import br.com.railsense_backend.dto.request.SensorRequest;
import br.com.railsense_backend.dto.response.SensorResponse;
import br.com.railsense_backend.service.EstruturaService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sensores")
public class SensorController {

    private final EstruturaService estrutura;

    public SensorController(EstruturaService estrutura) {
        this.estrutura = estrutura;
    }

    @GetMapping
    public List<SensorResponse> listar() {
        return estrutura.listarSensores();
    }

    @PostMapping
    public ResponseEntity<SensorResponse> criar(@Valid @RequestBody SensorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estrutura.criarSensor(request));
    }

    @PatchMapping("/{id}/ativo")
    public SensorResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request) {
        return estrutura.alterarAtivoSensor(id, request.ativo());
    }
}

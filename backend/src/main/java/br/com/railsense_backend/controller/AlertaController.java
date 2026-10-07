package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.response.AlertaResponse;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.repository.AlertaRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

    private final AlertaRepository alertas;

    public AlertaController(AlertaRepository alertas) {
        this.alertas = alertas;
    }

    @GetMapping
    public List<AlertaResponse> listar(@RequestParam(required = false) StatusAlerta status) {
        var lista = status != null ? alertas.findByStatus(status) : alertas.findAll();
        return lista.stream()
            .map(a -> new AlertaResponse(a.getId(), a.getNivel(), a.getStatus(), a.getScore(),
                a.getEixo().getId(), a.getEixo().getIdentificadorUnico(), a.getCriadoEm()))
            .toList();
    }
}
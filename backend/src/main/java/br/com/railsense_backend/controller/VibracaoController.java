package br.com.railsense_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.response.VibracaoResponse;
import br.com.railsense_backend.service.VibracaoService;

@RestController
public class VibracaoController {

    private final VibracaoService vibracao;

    public VibracaoController(VibracaoService vibracao) {
        this.vibracao = vibracao;
    }

    /** Leituras dos últimos {@code minutos} (1 a 60) do sensor de vibração do eixo. */
    @GetMapping("/api/eixos/{id}/vibracao")
    public VibracaoResponse listar(@PathVariable Long id, @RequestParam(defaultValue = "10") int minutos) {
        return vibracao.listar(id, minutos);
    }
}

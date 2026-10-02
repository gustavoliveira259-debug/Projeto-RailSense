package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.EixoRequest;
import br.com.railsense_backend.exception.VagaoNotFoundException;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.Vagao;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.VagaoRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eixos")
public class EixoController {

    private final EixoRepository eixos;
    private final VagaoRepository vagoes;

    public EixoController(EixoRepository eixos, VagaoRepository vagoes) {
        this.eixos = eixos;
        this.vagoes = vagoes;
    }

    @GetMapping
    public List<Eixo> listar() {
        return eixos.findAll();
    }

    @PostMapping
    public ResponseEntity<Eixo> criar(@Valid @RequestBody EixoRequest request) {
        Vagao vagao = vagoes.findById(request.vagaoId())
            .orElseThrow(() -> new VagaoNotFoundException(request.vagaoId()));

        Eixo salvo = eixos.save(Eixo.builder()
            .vagao(vagao)
            .posicao(request.posicao())
            .identificadorUnico(request.identificadorUnico())
            .ativo(true)
            .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
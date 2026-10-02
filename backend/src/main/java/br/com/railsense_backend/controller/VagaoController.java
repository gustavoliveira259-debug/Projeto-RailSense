package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.VagaoRequest;
import br.com.railsense_backend.exception.PatioLinhaNotFoundException;
import br.com.railsense_backend.models.PatioLinha;
import br.com.railsense_backend.models.Vagao;
import br.com.railsense_backend.repository.PatioLinhaRepository;
import br.com.railsense_backend.repository.VagaoRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vagoes")
public class VagaoController {

    private final VagaoRepository vagoes;
    private final PatioLinhaRepository patiosLinhas;

    public VagaoController(VagaoRepository vagoes, PatioLinhaRepository patiosLinhas) {
        this.vagoes = vagoes;
        this.patiosLinhas = patiosLinhas;
    }

    @GetMapping
    public List<Vagao> listar() {
        return vagoes.findAll();
    }

    @PostMapping
    public ResponseEntity<Vagao> criar(@Valid @RequestBody VagaoRequest request) {
        PatioLinha patioLinha = patiosLinhas.findById(request.patioLinhaId())
            .orElseThrow(() -> new PatioLinhaNotFoundException(request.patioLinhaId()));

        Vagao salvo = vagoes.save(Vagao.builder()
            .numeroUk(request.numeroUk())
            .tipo(request.tipo())
            .patioLinha(patioLinha)
            .ativo(true)
            .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.PatioLinhaRequest;
import br.com.railsense_backend.models.PatioLinha;
import br.com.railsense_backend.repository.PatioLinhaRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patios-linhas")
public class PatioLinhaController {

    private final PatioLinhaRepository repository;

    public PatioLinhaController(PatioLinhaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PatioLinha> listar() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<PatioLinha> criar(@Valid @RequestBody PatioLinhaRequest request) {
        PatioLinha salvo = repository.save(PatioLinha.builder()
            .nome(request.nome())
            .tipo(request.tipo())
            .ativo(true)
            .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
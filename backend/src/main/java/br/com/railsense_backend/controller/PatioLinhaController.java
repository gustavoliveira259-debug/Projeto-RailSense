package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.PatioLinhaRequest;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.dto.response.PatioLinhaResponse;
import br.com.railsense_backend.models.PatioLinha;
import br.com.railsense_backend.repository.PatioLinhaRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/patios-linhas")
public class PatioLinhaController {

    private final PatioLinhaRepository repository;

    public PatioLinhaController(PatioLinhaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public PageResponse<PatioLinhaResponse> listar(@PageableDefault(sort = "nome") Pageable pageable) {
        return PageResponse.of(repository.findAll(pageable), PatioLinhaResponse::from);
    }

    @PostMapping
    public ResponseEntity<PatioLinhaResponse> criar(@Valid @RequestBody PatioLinhaRequest request) {
        PatioLinha salvo = repository.save(PatioLinha.builder()
            .nome(request.nome())
            .tipo(request.tipo())
            .ativo(true)
            .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(PatioLinhaResponse.from(salvo));
    }
}
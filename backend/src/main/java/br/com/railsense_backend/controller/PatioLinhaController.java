package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.AtivoRequest;
import br.com.railsense_backend.dto.request.PatioLinhaRequest;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.dto.response.PatioLinhaResponse;
import br.com.railsense_backend.exception.PatioLinhaNotFoundException;
import br.com.railsense_backend.models.PatioLinha;
import br.com.railsense_backend.repository.PatioLinhaRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    @GetMapping("/{id}")
    public PatioLinhaResponse detalhar(@PathVariable Long id) {
        return PatioLinhaResponse.from(buscar(id));
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

    @PutMapping("/{id}")
    public PatioLinhaResponse atualizar(@PathVariable Long id, @Valid @RequestBody PatioLinhaRequest request) {
        PatioLinha patioLinha = buscar(id);
        patioLinha.setNome(request.nome());
        patioLinha.setTipo(request.tipo());
        return PatioLinhaResponse.from(repository.save(patioLinha));
    }

    /** Desativar em vez de excluir: vagões, imagens e alertas antigos continuam apontando para o registro. */
    @PatchMapping("/{id}/ativo")
    public PatioLinhaResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request) {
        PatioLinha patioLinha = buscar(id);
        patioLinha.setAtivo(request.ativo());
        return PatioLinhaResponse.from(repository.save(patioLinha));
    }

    private PatioLinha buscar(Long id) {
        return repository.findById(id).orElseThrow(() -> new PatioLinhaNotFoundException(id));
    }
}

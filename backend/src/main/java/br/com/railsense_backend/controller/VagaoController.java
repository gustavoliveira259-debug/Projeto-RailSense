package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.VagaoRequest;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.dto.response.VagaoResponse;
import br.com.railsense_backend.exception.PatioLinhaNotFoundException;
import br.com.railsense_backend.models.PatioLinha;
import br.com.railsense_backend.models.Vagao;
import br.com.railsense_backend.repository.PatioLinhaRepository;
import br.com.railsense_backend.repository.VagaoRepository;
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
@RequestMapping("/api/vagoes")
public class VagaoController {

    private final VagaoRepository vagoes;
    private final PatioLinhaRepository patiosLinhas;

    public VagaoController(VagaoRepository vagoes, PatioLinhaRepository patiosLinhas) {
        this.vagoes = vagoes;
        this.patiosLinhas = patiosLinhas;
    }

    @GetMapping
    public PageResponse<VagaoResponse> listar(@PageableDefault(sort = "numeroUk") Pageable pageable) {
        return PageResponse.of(vagoes.findAll(pageable), VagaoResponse::from);
    }

    @PostMapping
    public ResponseEntity<VagaoResponse> criar(@Valid @RequestBody VagaoRequest request) {
        PatioLinha patioLinha = patiosLinhas.findById(request.patioLinhaId())
            .orElseThrow(() -> new PatioLinhaNotFoundException(request.patioLinhaId()));

        Vagao salvo = vagoes.save(Vagao.builder()
            .numeroUk(request.numeroUk())
            .tipo(request.tipo())
            .patioLinha(patioLinha)
            .ativo(true)
            .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(VagaoResponse.from(salvo));
    }
}
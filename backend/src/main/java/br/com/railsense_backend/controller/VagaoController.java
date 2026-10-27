package br.com.railsense_backend.controller;

import br.com.railsense_backend.dto.request.AtivoRequest;
import br.com.railsense_backend.dto.request.VagaoRequest;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.dto.response.VagaoResponse;
import br.com.railsense_backend.exception.PatioLinhaNotFoundException;
import br.com.railsense_backend.exception.VagaoNotFoundException;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public PageResponse<VagaoResponse> listar(@RequestParam(required = false) Long patioLinhaId,
            @PageableDefault(sort = "numeroUk") Pageable pageable) {
        var pagina = patioLinhaId != null ? vagoes.findByPatioLinhaId(patioLinhaId, pageable) : vagoes.findAll(pageable);
        return PageResponse.of(pagina, VagaoResponse::from);
    }

    @GetMapping("/{id}")
    public VagaoResponse detalhar(@PathVariable Long id) {
        return VagaoResponse.from(buscar(id));
    }

    @PostMapping
    public ResponseEntity<VagaoResponse> criar(@Valid @RequestBody VagaoRequest request) {
        Vagao salvo = vagoes.save(Vagao.builder()
            .numeroUk(request.numeroUk())
            .tipo(request.tipo())
            .patioLinha(buscarPatioLinha(request.patioLinhaId()))
            .ativo(true)
            .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(VagaoResponse.from(salvo));
    }

    @PutMapping("/{id}")
    public VagaoResponse atualizar(@PathVariable Long id, @Valid @RequestBody VagaoRequest request) {
        Vagao vagao = buscar(id);
        vagao.setNumeroUk(request.numeroUk());
        vagao.setTipo(request.tipo());
        vagao.setPatioLinha(buscarPatioLinha(request.patioLinhaId()));
        return VagaoResponse.from(vagoes.save(vagao));
    }

    @PatchMapping("/{id}/ativo")
    public VagaoResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request) {
        Vagao vagao = buscar(id);
        vagao.setAtivo(request.ativo());
        return VagaoResponse.from(vagoes.save(vagao));
    }

    private Vagao buscar(Long id) {
        return vagoes.findById(id).orElseThrow(() -> new VagaoNotFoundException(id));
    }

    private PatioLinha buscarPatioLinha(Long id) {
        return patiosLinhas.findById(id).orElseThrow(() -> new PatioLinhaNotFoundException(id));
    }
}

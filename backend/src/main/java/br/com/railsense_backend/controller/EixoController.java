package br.com.railsense_backend.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

import br.com.railsense_backend.dto.request.AtivoRequest;
import br.com.railsense_backend.dto.request.EixoRequest;
import br.com.railsense_backend.dto.response.AnaliseResponse;
import br.com.railsense_backend.dto.response.EixoResponse;
import br.com.railsense_backend.dto.response.ImagemResponse;
import br.com.railsense_backend.dto.response.PageResponse;
import br.com.railsense_backend.exception.EixoNotFoundException;
import br.com.railsense_backend.exception.VagaoNotFoundException;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.Vagao;
import br.com.railsense_backend.repository.AnaliseRepository;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.ImagemRepository;
import br.com.railsense_backend.repository.VagaoRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/eixos")
public class EixoController {

    private final EixoRepository eixos;
    private final VagaoRepository vagoes;
    private final ImagemRepository imagens;
    private final AnaliseRepository analises;

    public EixoController(EixoRepository eixos, VagaoRepository vagoes, ImagemRepository imagens,
            AnaliseRepository analises) {
        this.eixos = eixos;
        this.vagoes = vagoes;
        this.imagens = imagens;
        this.analises = analises;
    }

    @GetMapping
    public PageResponse<EixoResponse> listar(@RequestParam(required = false) Long vagaoId,
            @PageableDefault(sort = "identificadorUnico") Pageable pageable) {
        var pagina = vagaoId != null ? eixos.findByVagaoId(vagaoId, pageable) : eixos.findAll(pageable);
        return PageResponse.of(pagina, EixoResponse::from);
    }

    @GetMapping("/{id}")
    public EixoResponse detalhar(@PathVariable Long id) {
        return EixoResponse.from(buscar(id));
    }

    @GetMapping("/{id}/imagens")
    public PageResponse<ImagemResponse> listarImagens(@PathVariable Long id,
            @PageableDefault(sort = "timestampCaptura", direction = Sort.Direction.DESC) Pageable pageable) {
        garantirQueExiste(id);
        return PageResponse.of(imagens.findByEixoId(id, pageable), i -> new ImagemResponse(i.getId(),
                i.getUrlArquivo(), i.getTimestampCaptura(), i.isEhBaseline(), i.isBaselineAtiva()));
    }

    /** Histórico de comparações do eixo, inclusive as que não geraram alerta. */
    @GetMapping("/{id}/analises")
    public PageResponse<AnaliseResponse> listarAnalises(@PathVariable Long id,
            @PageableDefault(sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        garantirQueExiste(id);
        return PageResponse.of(analises.findByImagemAtualEixoId(id, pageable), AnaliseResponse::from);
    }

    @PostMapping
    public ResponseEntity<EixoResponse> criar(@Valid @RequestBody EixoRequest request) {
        Eixo salvo = eixos.save(Eixo.builder()
                .vagao(buscarVagao(request.vagaoId()))
                .posicao(request.posicao())
                .identificadorUnico(request.identificadorUnico())
                .ativo(true)
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(EixoResponse.from(salvo));
    }

    @PutMapping("/{id}")
    public EixoResponse atualizar(@PathVariable Long id, @Valid @RequestBody EixoRequest request) {
        Eixo eixo = buscar(id);
        eixo.setVagao(buscarVagao(request.vagaoId()));
        eixo.setPosicao(request.posicao());
        eixo.setIdentificadorUnico(request.identificadorUnico());
        return EixoResponse.from(eixos.save(eixo));
    }

    /** Eixo desativado deixa de aceitar imagens novas (ver ImageService). */
    @PatchMapping("/{id}/ativo")
    public EixoResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request) {
        Eixo eixo = buscar(id);
        eixo.setAtivo(request.ativo());
        return EixoResponse.from(eixos.save(eixo));
    }

    private Eixo buscar(Long id) {
        return eixos.findById(id).orElseThrow(() -> new EixoNotFoundException(id));
    }

    private void garantirQueExiste(Long id) {
        if (!eixos.existsById(id)) {
            throw new EixoNotFoundException(id);
        }
    }

    private Vagao buscarVagao(Long id) {
        return vagoes.findById(id).orElseThrow(() -> new VagaoNotFoundException(id));
    }
}

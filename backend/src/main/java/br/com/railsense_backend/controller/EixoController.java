package br.com.railsense_backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.request.EixoRequest;
import br.com.railsense_backend.dto.response.EixoResponse;
import br.com.railsense_backend.dto.response.ImagemResponse;
import br.com.railsense_backend.exception.VagaoNotFoundException;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.Vagao;
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

    public EixoController(EixoRepository eixos, VagaoRepository vagoes, ImagemRepository imagens) {
        this.eixos = eixos;
        this.vagoes = vagoes;
        this.imagens = imagens;
    }

    @GetMapping
    public List<EixoResponse> listar() {
        return eixos.findAll().stream()
                .map(e -> new EixoResponse(
                        e.getId(),
                        e.getPosicao(),
                        e.getIdentificadorUnico(),
                        e.getVagao().getNumeroUk(),
                        e.getVagao().getPatioLinha().getNome()))
                .toList();
    }

    @GetMapping("/{id}/imagens")
    public List<ImagemResponse> listarImagens(@PathVariable Long id) {
        return imagens.findByEixoIdOrderByTimestampCapturaDesc(id).stream()
                .map(i -> new ImagemResponse(i.getId(), i.getUrlArquivo(), i.getTimestampCaptura(),
                        i.isEhBaseline(), i.isBaselineAtiva()))
                .toList();
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
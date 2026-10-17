package br.com.railsense_backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.request.AtivoRequest;
import br.com.railsense_backend.dto.request.EixoRequest;
import br.com.railsense_backend.dto.response.EixoResponse;
import br.com.railsense_backend.dto.response.ImagemResponse;
import br.com.railsense_backend.dto.response.SerieLeiturasResponse;
import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.service.EstruturaService;
import br.com.railsense_backend.service.ImageService;
import br.com.railsense_backend.service.LeituraService;
import br.com.railsense_backend.service.MonitoramentoService;
import jakarta.validation.Valid;

/** Eixos monitorados. Na interface aparecem como "rolamentos". */
@RestController
@RequestMapping("/api/eixos")
public class EixoController {

    private final MonitoramentoService monitoramento;
    private final EstruturaService estrutura;
    private final LeituraService leituras;
    private final ImageService imagens;

    public EixoController(MonitoramentoService monitoramento, EstruturaService estrutura,
            LeituraService leituras, ImageService imagens) {
        this.monitoramento = monitoramento;
        this.estrutura = estrutura;
        this.leituras = leituras;
        this.imagens = imagens;
    }

    @GetMapping
    public List<EixoResponse> listar(@RequestParam(required = false) Long vagaoId) {
        return monitoramento.listarEixos(vagaoId);
    }

    @GetMapping("/{id}")
    public EixoResponse detalhar(@PathVariable Long id) {
        return monitoramento.buscarEixo(id);
    }

    @GetMapping("/{id}/imagens")
    public List<ImagemResponse> listarImagens(@PathVariable Long id) {
        return imagens.listarDoEixo(id);
    }

    @GetMapping("/{id}/leituras")
    public SerieLeiturasResponse leituras(@PathVariable Long id, @RequestParam TipoSensor tipo,
            @RequestParam(defaultValue = "60") int minutos) {
        return leituras.serie(id, tipo, minutos);
    }

    @PostMapping
    public ResponseEntity<EixoResponse> criar(@Valid @RequestBody EixoRequest request) {
        Long id = estrutura.criarEixo(request).getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoramento.buscarEixo(id));
    }

    @PatchMapping("/{id}/ativo")
    public EixoResponse alterarAtivo(@PathVariable Long id, @Valid @RequestBody AtivoRequest request) {
        estrutura.alterarAtivoEixo(id, request.ativo());
        return monitoramento.buscarEixo(id);
    }
}

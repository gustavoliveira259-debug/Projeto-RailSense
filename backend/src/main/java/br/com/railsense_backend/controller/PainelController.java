package br.com.railsense_backend.controller;

import java.time.DateTimeException;
import java.time.ZoneId;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.railsense_backend.dto.response.PainelResumoResponse;
import br.com.railsense_backend.service.PainelService;

@RestController
@RequestMapping("/api/painel")
public class PainelController {

    private static final ZoneId FUSO_PADRAO = ZoneId.of("America/Sao_Paulo");

    private final PainelService painel;

    public PainelController(PainelService painel) {
        this.painel = painel;
    }

    /** {@code fuso} (ex.: America/Sao_Paulo) define onde cada dia começa; inválido usa o padrão. */
    @GetMapping("/resumo")
    public PainelResumoResponse resumo(@RequestParam(required = false) String fuso) {
        return painel.resumo(fusoOuPadrao(fuso));
    }

    private static ZoneId fusoOuPadrao(String fuso) {
        if (fuso == null || fuso.isBlank()) {
            return FUSO_PADRAO;
        }
        try {
            return ZoneId.of(fuso);
        } catch (DateTimeException e) {
            return FUSO_PADRAO;
        }
    }
}

package br.com.railsense_backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.response.AlertaResponse;
import br.com.railsense_backend.dto.response.OrdemManutencaoResponse;
import br.com.railsense_backend.dto.response.PainelResumoResponse;
import br.com.railsense_backend.dto.response.PainelResumoResponse.AlertasDoDia;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.repository.AlertaRepository;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.OrdemManutencaoRepository;
import br.com.railsense_backend.repository.VagaoRepository;

@Service
public class PainelService {

    static final int DIAS = 14;
    static final int TAMANHO_FILA = 6;
    static final int TAMANHO_ORDENS = 4;

    private final AlertaRepository alertas;
    private final OrdemManutencaoRepository ordens;
    private final EixoRepository eixos;
    private final VagaoRepository vagoes;

    public PainelService(AlertaRepository alertas, OrdemManutencaoRepository ordens,
            EixoRepository eixos, VagaoRepository vagoes) {
        this.alertas = alertas;
        this.ordens = ordens;
        this.eixos = eixos;
        this.vagoes = vagoes;
    }

    @Transactional(readOnly = true)
    public PainelResumoResponse resumo(ZoneId fuso) {
        return resumo(fuso, Instant.now());
    }

    @Transactional(readOnly = true)
    PainelResumoResponse resumo(ZoneId fuso, Instant agora) {
        LocalDate hoje = LocalDate.ofInstant(agora, fuso);
        LocalDate primeiroDia = hoje.minusDays(DIAS - 1);
        Instant desde = primeiroDia.atStartOfDay(fuso).toInstant();

        return new PainelResumoResponse(
            agora,
            contagem(StatusAlerta.class, alertas.contarPorStatus()),
            contagem(NivelAlerta.class, alertas.contarPorNivel(StatusAlerta.EM_ANALISE)),
            contagem(StatusOrdem.class, ordens.contarPorStatus()),
            eixos.countByAtivoTrue(),
            vagoes.countByAtivoTrue(),
            porDia(alertas.listarCriadoEmENivelDesde(desde), primeiroDia, hoje, fuso),
            alertas.findPorGravidade(StatusAlerta.EM_ANALISE, PageRequest.of(0, TAMANHO_FILA)).stream()
                .map(AlertaResponse::from).toList(),
            ordens.findPorPrioridade(List.of(StatusOrdem.ABERTA, StatusOrdem.EM_ANDAMENTO),
                PageRequest.of(0, TAMANHO_ORDENS)).stream()
                .map(OrdemManutencaoResponse::from).toList());
    }

    /** Linhas [chave, total] viram um mapa com todas as chaves do enum (as ausentes com 0). */
    private static <E extends Enum<E>> Map<E, Long> contagem(Class<E> tipo, List<Object[]> linhas) {
        Map<E, Long> mapa = new EnumMap<>(tipo);
        for (E chave : tipo.getEnumConstants()) {
            mapa.put(chave, 0L);
        }
        for (Object[] linha : linhas) {
            mapa.put(tipo.cast(linha[0]), (Long) linha[1]);
        }
        return mapa;
    }

    private static List<AlertasDoDia> porDia(List<Object[]> linhas, LocalDate primeiroDia, LocalDate hoje,
            ZoneId fuso) {
        Map<LocalDate, long[]> dias = new LinkedHashMap<>();
        for (LocalDate dia = primeiroDia; !dia.isAfter(hoje); dia = dia.plusDays(1)) {
            dias.put(dia, new long[NivelAlerta.values().length]);
        }
        for (Object[] linha : linhas) {
            long[] totais = dias.get(LocalDate.ofInstant((Instant) linha[0], fuso));
            if (totais != null) {
                totais[((NivelAlerta) linha[1]).ordinal()]++;
            }
        }
        return dias.entrySet().stream()
            .map(e -> new AlertasDoDia(e.getKey(), e.getValue()[NivelAlerta.BAIXO.ordinal()],
                e.getValue()[NivelAlerta.MEDIO.ordinal()], e.getValue()[NivelAlerta.CRITICO.ordinal()]))
            .toList();
    }
}

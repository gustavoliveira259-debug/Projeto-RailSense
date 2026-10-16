package br.com.railsense_backend.dto.response;

import java.time.Instant;
import java.util.List;

import br.com.railsense_backend.enums.Classificacao;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;

public record AlertaDetalheResponse(
    Long id,
    NivelAlerta nivel,
    StatusAlerta status,
    Float score,
    Long eixoId,
    String eixoIdentificador,
    Instant criadoEm,
    Classificacao classificacao,
    List<String> regioesAnomalia,
    List<EvidenciaResponse> evidencias,
    List<DecisaoAlertaResponse> decisoes
) {}

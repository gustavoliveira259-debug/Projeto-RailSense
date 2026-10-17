package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.enums.StatusMonitoramento;

public record VagaoResponse(
    Long id,
    String numeroUk,
    String tipo,
    Long tremId,
    String tremCodigo,
    Long patioLinhaId,
    String nomePatioLinha,
    boolean ativo,
    int totalRolamentos,
    int alertasAtivos,
    int alertasCriticos,
    StatusMonitoramento status
) {}

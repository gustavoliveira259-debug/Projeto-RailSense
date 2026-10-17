package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.enums.StatusMonitoramento;

public record TremResponse(
    Long id,
    String codigo,
    String nome,
    boolean ativo,
    int totalVagoes,
    int totalRolamentos,
    int alertasAtivos,
    int alertasCriticos,
    StatusMonitoramento status
) {}

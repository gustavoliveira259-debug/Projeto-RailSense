package br.com.railsense_backend.dto.response;

import java.time.Instant;

import br.com.railsense_backend.enums.StatusMonitoramento;

/** Eixo monitorado (rolamento, na interface), com a situação calculada e as últimas leituras. */
public record EixoResponse(
    Long id,
    int posicao,
    String identificadorUnico,
    Long vagaoId,
    String numeroUk,
    Long tremId,
    String tremCodigo,
    String nomePatioLinha,
    boolean ativo,
    StatusMonitoramento status,
    int alertasAtivos,
    int alertasCriticos,
    Double vibracao,
    Double temperatura,
    Instant ultimaLeituraEm
) {}

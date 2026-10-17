package br.com.railsense_backend.enums;

public enum StatusAlerta {
    /** Status inicial de todo alerta: aguarda a decisão de um engenheiro. */
    EM_ANALISE,
    CONFIRMADO,
    FALSO_POSITIVO,
    FECHADO
}

package br.com.railsense_backend.enums;

/** Situação calculada de rolamento, vagão ou trem. A ordem vai do menos ao mais grave. */
public enum StatusMonitoramento {
    SEM_LEITURAS,
    NORMAL,
    ATENCAO,
    CRITICO
}

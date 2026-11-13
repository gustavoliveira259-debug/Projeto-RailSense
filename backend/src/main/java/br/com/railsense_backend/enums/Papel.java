package br.com.railsense_backend.enums;

/**
 * ADMIN cuida das contas de usuário. GESTOR administra o monitoramento: cadastros da frota,
 * baseline, decisão de alertas e abertura/cancelamento de ordens. ENGENHEIRO visualiza tudo e
 * atende as ordens de manutenção (inicia e conclui).
 */
public enum Papel {
    ENGENHEIRO,
    GESTOR,
    ADMIN
}

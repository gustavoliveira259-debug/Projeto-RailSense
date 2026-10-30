package br.com.railsense_backend.dto.response;

import java.time.Instant;
import java.util.List;

/**
 * Leituras recentes do sensor de vibração de um eixo, em ordem cronológica.
 * sensorDispositivo é null quando o eixo ainda não tem sensor vinculado.
 */
public record VibracaoResponse(
    Long eixoId,
    String sensorDispositivo,
    int limiar,
    int valorMaximo,
    List<Leitura> leituras
) {
    public record Leitura(int valor, Instant lidoEm) {}
}

package br.com.railsense_backend.dto.response;

import java.time.Instant;

import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.models.Sensor;

public record SensorResponse(
    Long id,
    String codigo,
    TipoSensor tipo,
    Long eixoId,
    String eixoIdentificador,
    String numeroUk,
    String tremCodigo,
    boolean ativo,
    Double ultimoValor,
    Instant ultimaLeituraEm
) {
    public static SensorResponse from(Sensor s) {
        var eixo = s.getEixo();
        var vagao = eixo.getVagao();
        return new SensorResponse(s.getId(), s.getCodigo(), s.getTipo(), eixo.getId(), eixo.getIdentificadorUnico(),
            vagao != null ? vagao.getNumeroUk() : null,
            vagao != null && vagao.getTrem() != null ? vagao.getTrem().getCodigo() : null,
            s.isAtivo(), s.getUltimoValor(), s.getUltimaLeituraEm());
    }
}

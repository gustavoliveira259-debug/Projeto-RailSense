package br.com.railsense_backend.mqtt;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import br.com.railsense_backend.enums.TipoSensor;
import tools.jackson.databind.json.JsonMapper;

class MensagemSensorTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void interpretaMensagemDoFirmware() {
        var m = MensagemSensor.interpretar("railsense/sensor/vibracao", bytes("{\"device\":\"esp32-01\",\"valor\":2048}"),
            mapper);

        assertThat(m).contains(new MensagemSensor("esp32-01", TipoSensor.VIBRACAO, 2048));
    }

    @Test
    void tipoVemDoTopico() {
        var m = MensagemSensor.interpretar("railsense/sensor/temperatura", bytes("{\"device\":\"t1\",\"valor\":41.5}"),
            mapper);

        assertThat(m).map(MensagemSensor::tipo).contains(TipoSensor.TEMPERATURA);
    }

    @Test
    void rejeitaTopicoDesconhecidoECorpoInvalido() {
        assertThat(MensagemSensor.interpretar("railsense/sensor/pressao", bytes("{\"device\":\"a\",\"valor\":1}"), mapper))
            .isEmpty();
        assertThat(MensagemSensor.interpretar("railsense/sensor/vibracao", bytes("2048"), mapper)).isEmpty();
        assertThat(MensagemSensor.interpretar("railsense/sensor/vibracao", bytes("{\"valor\":1}"), mapper)).isEmpty();
        assertThat(MensagemSensor.interpretar("railsense/sensor/vibracao", bytes("{\"device\":\"a\"}"), mapper)).isEmpty();
        assertThat(MensagemSensor.interpretar("railsense/sensor/vibracao", bytes("não é json"), mapper)).isEmpty();
    }

    private static byte[] bytes(String s) {
        return s.getBytes(StandardCharsets.UTF_8);
    }
}

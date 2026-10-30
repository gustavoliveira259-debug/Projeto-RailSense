package br.com.railsense_backend.mqtt;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import tools.jackson.databind.json.JsonMapper;

class VibracaoMensagemParserTest {

    private final VibracaoMensagemParser parser = new VibracaoMensagemParser(JsonMapper.builder().build());

    private static byte[] bytes(String s) {
        return s.getBytes(StandardCharsets.UTF_8);
    }

    @Test
    void leMensagemDoFirmware() {
        assertThat(parser.ler(bytes("{\"device\":\"esp32-01\",\"valor\":2048}")))
            .contains(new VibracaoMensagemParser.Mensagem("esp32-01", 2048));
    }

    @Test
    void ignoraCamposExtras() {
        assertThat(parser.ler(bytes("{\"device\":\"esp32-01\",\"valor\":10,\"rssi\":-60}"))).isPresent();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "2048",
        "nao e json",
        "{}",
        "{\"valor\":10}",
        "{\"device\":\"esp32-01\"}",
        "{\"device\":\"esp32-01\",\"valor\":-1}",
        "{\"device\":\"com espaco\",\"valor\":10}",
        "{\"device\":\"\",\"valor\":10}"
    })
    void descartaMensagemInvalida(String payload) {
        assertThat(parser.ler(bytes(payload))).isEmpty();
    }
}

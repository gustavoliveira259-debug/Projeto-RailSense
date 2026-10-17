package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import br.com.railsense_backend.exception.ArquivoInvalidoException;

class ImageFileValidatorTest {

    private final ImageFileValidator validator = new ImageFileValidator();

    /** Recebe int... para aceitar literais como 0xFF e 'P' sem cast para byte. */
    private static MockMultipartFile arquivo(String contentType, int... conteudo) {
        byte[] bytes = new byte[conteudo.length];
        for (int i = 0; i < conteudo.length; i++) {
            bytes[i] = (byte) conteudo[i];
        }
        return new MockMultipartFile("file", "x", contentType, bytes);
    }

    @Test
    void detectaJpegPelosBytesMesmoComContentTypeErrado() {
        var file = arquivo("application/octet-stream", (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0);
        assertThat(validator.validar(file)).isEqualTo("image/jpeg");
    }

    @Test
    void detectaPng() {
        var file = arquivo("image/png", (byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0, 0, 0);
        assertThat(validator.validar(file)).isEqualTo("image/png");
    }

    @Test
    void detectaWebp() {
        var file = arquivo("image/webp", 'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P');
        assertThat(validator.validar(file)).isEqualTo("image/webp");
    }

    @Test
    void rejeitaArquivoQueNaoEImagemMesmoDeclarandoImageJpeg() {
        var file = new MockMultipartFile("file", "x", "image/jpeg", "<html>nao sou imagem</html>".getBytes());
        assertThatThrownBy(() -> validator.validar(file)).isInstanceOf(ArquivoInvalidoException.class);
    }

    @Test
    void rejeitaArquivoVazio() {
        assertThatThrownBy(() -> validator.validar(arquivo("image/jpeg")))
            .isInstanceOf(ArquivoInvalidoException.class);
    }

    @Test
    void rejeitaRiffQueNaoEWebp() {
        var wav = arquivo("audio/wav", 'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E');
        assertThatThrownBy(() -> validator.validar(wav)).isInstanceOf(ArquivoInvalidoException.class);
    }
}

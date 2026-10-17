package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import br.com.railsense_backend.enums.Classificacao;
import br.com.railsense_backend.exception.GeminiAnalysisException;
import tools.jackson.databind.json.JsonMapper;

class GeminiResponseParserTest {

    private final GeminiResponseParser parser = new GeminiResponseParser(JsonMapper.builder().build());

    /** Monta o envelope que a API generateContent devolve, com o JSON do modelo em parts[0].text. */
    private static Map<String, Object> resposta(String jsonDoModelo) {
        return Map.of("candidates", List.of(Map.of(
            "content", Map.of("parts", List.of(Map.of("text", jsonDoModelo))))));
    }

    @Test
    void interpretaRespostaValida() {
        var parsed = parser.parse(resposta("""
            {"classificacao":"VAZAMENTO","score_diferenca":0.85,"regioes_anomalia":["roda esquerda"]}"""));

        assertThat(parsed.classificacao()).isEqualTo(Classificacao.VAZAMENTO);
        assertThat(parsed.scoreDiferenca()).isEqualTo(0.85f);
        assertThat(parsed.regioesAnomalia()).containsExactly("roda esquerda");
    }

    @Test
    void normalizaClassificacaoEmMinusculasComEspacos() {
        var parsed = parser.parse(resposta("""
            {"classificacao":" suspeito ","score_diferenca":0.4,"regioes_anomalia":[]}"""));
        assertThat(parsed.classificacao()).isEqualTo(Classificacao.SUSPEITO);
    }

    @Test
    void regioesAusentesViramListaVazia() {
        var parsed = parser.parse(resposta("""
            {"classificacao":"NORMAL","score_diferenca":0.0}"""));
        assertThat(parsed.regioesAnomalia()).isEmpty();
    }

    @Test
    void rejeitaScoreForaDoIntervalo() {
        assertThatThrownBy(() -> parser.parse(resposta("""
            {"classificacao":"NORMAL","score_diferenca":1.5,"regioes_anomalia":[]}""")))
            .isInstanceOf(GeminiAnalysisException.class);
    }

    @Test
    void rejeitaClassificacaoDesconhecida() {
        assertThatThrownBy(() -> parser.parse(resposta("""
            {"classificacao":"TALVEZ","score_diferenca":0.5,"regioes_anomalia":[]}""")))
            .isInstanceOf(GeminiAnalysisException.class);
    }

    @Test
    void rejeitaTextoQueNaoEJson() {
        assertThatThrownBy(() -> parser.parse(resposta("Desculpe, não consegui analisar.")))
            .isInstanceOf(GeminiAnalysisException.class);
    }

    @Test
    void rejeitaEnvelopeSemCandidates() {
        assertThatThrownBy(() -> parser.parse(Map.of("promptFeedback", Map.of("blockReason", "SAFETY"))))
            .isInstanceOf(GeminiAnalysisException.class);
    }
}

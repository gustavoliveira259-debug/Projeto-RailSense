package br.com.railsense_backend.models;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import br.com.railsense_backend.enums.Classificacao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "analises")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class Analise extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imagem_atual_id")
    private Imagem imagemAtual;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imagem_baseline_id")
    private Imagem imagemBaseline;

    @Column(name = "score_diferenca")
    private Float scoreDiferenca;

    @Column(name = "limiar_utilizado")
    private Float limiarUtilizado;

    @Enumerated(EnumType.STRING)
    private Classificacao classificacao;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "regioes_anomalia")
    private Map<String, Object> regioesAnomalia;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "resposta_bruta")
    private Map<String, Object> respostaBruta; // JSON cru do Gemini
}

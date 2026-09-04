package br.com.railsense_backend.models;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "imagens")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class Imagem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eixo_id")
    private Eixo eixo;

    @Column(name = "url_arquivo", nullable = false)
    private String urlArquivo;

    @Column(name = "timestamp_captura")
    private Instant timestampCaptura;

    @Column(name = "eh_baseline")
    private boolean ehBaseline = false;

    @Column(name = "baseline_ativa")
    private boolean baselineAtiva = false; // só 1 true por eixo
}
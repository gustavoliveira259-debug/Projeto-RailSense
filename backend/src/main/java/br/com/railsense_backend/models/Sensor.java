package br.com.railsense_backend.models;

import java.time.Instant;

import br.com.railsense_backend.enums.TipoSensor;
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
@Table(name = "sensores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sensor extends BaseEntity {

    /** Valor do campo "device" na mensagem MQTT. Único por tipo. */
    @Column(nullable = false)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoSensor tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eixo_id", nullable = false)
    private Eixo eixo;

    @Builder.Default
    private boolean ativo = true;

    @Column(name = "ultimo_valor")
    private Double ultimoValor;

    @Column(name = "ultima_leitura_em")
    private Instant ultimaLeituraEm;
}

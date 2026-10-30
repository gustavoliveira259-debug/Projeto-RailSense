package br.com.railsense_backend.models;

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

/** Uma mensagem do tópico railsense/sensor/vibracao, já associada ao eixo do sensor. */
@Entity
@Table(name = "leituras_vibracao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeituraVibracao extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "eixo_id")
    private Eixo eixo;

    @Column(nullable = false)
    private String dispositivo;

    /** Leitura crua do ADC do ESP32 (0 a 4095). */
    private int valor;
}

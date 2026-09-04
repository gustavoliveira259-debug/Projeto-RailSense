package br.com.railsense_backend.models;

import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "alertas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alerta extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analise_id")
    private Analise analise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eixo_id")
    private Eixo eixo;

    @Enumerated(EnumType.STRING)
    private NivelAlerta nivel;

    @Enumerated(EnumType.STRING)
    private StatusAlerta status;

    private Float score;
}

package br.com.railsense_backend.models;

import br.com.railsense_backend.enums.DecisaoTipo;
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
@Table(name = "decisoes_alerta")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class DecisaoAlerta extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alerta_id")
    private Alerta alerta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    private DecisaoTipo decisao;

    @Column(columnDefinition = "TEXT")
    private String motivo;
}

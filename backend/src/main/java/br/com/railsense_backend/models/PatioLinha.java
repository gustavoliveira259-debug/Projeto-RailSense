package br.com.railsense_backend.models;

import br.com.railsense_backend.enums.TipoPatioLinha;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatioLinha extends BaseEntity {
    
    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    private TipoPatioLinha tipo;

    private boolean ativo = true;
}

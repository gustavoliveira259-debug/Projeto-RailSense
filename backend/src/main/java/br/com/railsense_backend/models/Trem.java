package br.com.railsense_backend.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "trens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trem extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String codigo;

    private String nome;

    @Builder.Default
    private boolean ativo = true;
}

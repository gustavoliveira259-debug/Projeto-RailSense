package br.com.railsense_backend.models;

import br.com.railsense_backend.enums.Papel;
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
@Table(name = "usuarios")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class Usuario extends BaseEntity {

    private String nome;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "hash_senha")
    private String hashSenha;

    @Enumerated(EnumType.STRING)
    private Papel papel;

    private boolean ativo = true;
}
package br.com.railsense_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import br.com.railsense_backend.models.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmailIgnoreCase(String email);
}

package br.com.railsense_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {}

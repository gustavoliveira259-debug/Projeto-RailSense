package br.com.railsense_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Imagem;

public interface ImagemRepository extends JpaRepository<Imagem, Long> {
    Optional<Imagem> findByEixoIdAndBaselineAtivaTrue(Long eixoId);
}
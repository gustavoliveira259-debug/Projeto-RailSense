package br.com.railsense_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.OrdemManutencao;

public interface OrdemManutencaoRepository extends JpaRepository<OrdemManutencao, Long> {}

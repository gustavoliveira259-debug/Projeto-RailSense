package br.com.railsense_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Alerta;

public interface AlertaRepository extends JpaRepository<Alerta, Long>{}

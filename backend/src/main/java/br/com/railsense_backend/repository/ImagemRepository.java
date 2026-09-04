package br.com.railsense_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Imagem;

public interface ImagemRepository extends JpaRepository<Imagem, Long>{}

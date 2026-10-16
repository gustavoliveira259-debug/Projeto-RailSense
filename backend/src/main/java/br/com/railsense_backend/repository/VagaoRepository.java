package br.com.railsense_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Vagao;

public interface VagaoRepository extends JpaRepository<Vagao, Long> {
    @Override
    @EntityGraph(attributePaths = "patioLinha")
    List<Vagao> findAll();
}

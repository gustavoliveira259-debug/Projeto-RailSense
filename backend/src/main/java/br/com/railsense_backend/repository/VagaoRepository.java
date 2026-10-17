package br.com.railsense_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Vagao;

public interface VagaoRepository extends JpaRepository<Vagao, Long> {
    @Override
    @EntityGraph(attributePaths = {"patioLinha", "trem"})
    List<Vagao> findAll();

    @Override
    @EntityGraph(attributePaths = {"patioLinha", "trem"})
    Optional<Vagao> findById(Long id);

    @EntityGraph(attributePaths = {"patioLinha", "trem"})
    List<Vagao> findByTremId(Long tremId);

    boolean existsByNumeroUkIgnoreCase(String numeroUk);
}

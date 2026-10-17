package br.com.railsense_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Vagao;

public interface VagaoRepository extends JpaRepository<Vagao, Long> {
    @Override
    @EntityGraph(attributePaths = "patioLinha")
    Page<Vagao> findAll(Pageable pageable);
}

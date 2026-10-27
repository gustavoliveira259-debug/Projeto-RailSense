package br.com.railsense_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Eixo;

public interface EixoRepository extends JpaRepository<Eixo, Long> {

    @Override
    @EntityGraph(attributePaths = {"vagao", "vagao.patioLinha"})
    Page<Eixo> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"vagao", "vagao.patioLinha"})
    Page<Eixo> findByVagaoId(Long vagaoId, Pageable pageable);
}

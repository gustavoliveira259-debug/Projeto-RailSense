package br.com.railsense_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Eixo;

public interface EixoRepository extends JpaRepository<Eixo, Long> {
    @Override
    @EntityGraph(attributePaths = {"vagao", "vagao.patioLinha", "vagao.trem"})
    List<Eixo> findAll();

    @Override
    @EntityGraph(attributePaths = {"vagao", "vagao.patioLinha", "vagao.trem"})
    Optional<Eixo> findById(Long id);

    @EntityGraph(attributePaths = {"vagao", "vagao.patioLinha", "vagao.trem"})
    List<Eixo> findByVagaoIdOrderByPosicaoAsc(Long vagaoId);

    boolean existsByIdentificadorUnicoIgnoreCase(String identificadorUnico);
}

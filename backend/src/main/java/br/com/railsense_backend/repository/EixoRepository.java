package br.com.railsense_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Eixo;

public interface EixoRepository extends JpaRepository<Eixo, Long> {
    @Override
    @EntityGraph(attributePaths = {"vagao", "vagao.patioLinha"})
    List<Eixo> findAll();
}

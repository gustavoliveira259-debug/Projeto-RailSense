package br.com.railsense_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Analise;

public interface AnaliseRepository extends JpaRepository<Analise, Long> {

    @EntityGraph(attributePaths = "imagemAtual")
    Page<Analise> findByImagemAtualEixoId(Long eixoId, Pageable pageable);
}

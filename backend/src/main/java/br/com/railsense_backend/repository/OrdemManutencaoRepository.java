package br.com.railsense_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.models.OrdemManutencao;

public interface OrdemManutencaoRepository extends JpaRepository<OrdemManutencao, Long> {
    @Override
    @EntityGraph(attributePaths = {"alerta", "eixo", "criadoPor"})
    Page<OrdemManutencao> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"alerta", "eixo", "criadoPor"})
    Page<OrdemManutencao> findByStatus(StatusOrdem status, Pageable pageable);

    boolean existsByAlertaIdAndStatusNot(Long alertaId, StatusOrdem status);
}

package br.com.railsense_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.models.OrdemManutencao;

public interface OrdemManutencaoRepository extends JpaRepository<OrdemManutencao, Long> {
    @Override
    @EntityGraph(attributePaths = {"alerta", "eixo", "criadoPor"})
    List<OrdemManutencao> findAll();

    @EntityGraph(attributePaths = {"alerta", "eixo", "criadoPor"})
    List<OrdemManutencao> findByStatus(StatusOrdem status);

    boolean existsByAlertaIdAndStatusNot(Long alertaId, StatusOrdem status);
}

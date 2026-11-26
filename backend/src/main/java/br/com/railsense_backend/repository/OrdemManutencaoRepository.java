package br.com.railsense_backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.models.OrdemManutencao;

public interface OrdemManutencaoRepository extends JpaRepository<OrdemManutencao, Long> {
    @Override
    @EntityGraph(attributePaths = {"alerta", "eixo", "criadoPor"})
    Page<OrdemManutencao> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"alerta", "eixo", "criadoPor"})
    Page<OrdemManutencao> findByStatus(StatusOrdem status, Pageable pageable);

    boolean existsByAlertaIdAndStatusNot(Long alertaId, StatusOrdem status);

    /** [status, total] de todas as ordens. */
    @Query("select o.status, count(o) from OrdemManutencao o group by o.status")
    List<Object[]> contarPorStatus();

    /** Mais urgentes primeiro e, na mesma prioridade, as mais antigas (prioridade é gravada como texto). */
    @EntityGraph(attributePaths = {"alerta", "eixo", "criadoPor"})
    @Query("""
        select o from OrdemManutencao o where o.status in :status
        order by case o.prioridade
            when br.com.railsense_backend.enums.Prioridade.URGENTE then 0
            when br.com.railsense_backend.enums.Prioridade.ALTA then 1
            when br.com.railsense_backend.enums.Prioridade.MEDIA then 2
            else 3 end, o.criadoEm asc""")
    List<OrdemManutencao> findPorPrioridade(Collection<StatusOrdem> status, Pageable limite);
}

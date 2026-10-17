package br.com.railsense_backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.models.Alerta;
import jakarta.persistence.LockModeType;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {
    @Override
    @EntityGraph(attributePaths = {"eixo", "eixo.vagao", "eixo.vagao.trem"})
    List<Alerta> findAll();

    @EntityGraph(attributePaths = {"eixo", "eixo.vagao", "eixo.vagao.trem"})
    List<Alerta> findByStatus(StatusAlerta status);

    @EntityGraph(attributePaths = {"eixo", "eixo.vagao", "eixo.vagao.trem"})
    List<Alerta> findByEixoId(Long eixoId);

    /** Usado no cálculo de status: só precisa do id do eixo, sem carregar o grafo. */
    List<Alerta> findByStatusIn(Collection<StatusAlerta> status);

    List<Alerta> findByAnaliseIdIn(Collection<Long> analiseIds);

    /** Trava a linha do alerta até o fim da transação, evitando duas decisões simultâneas. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Alerta a where a.id = :id")
    Optional<Alerta> findByIdForUpdate(Long id);
}

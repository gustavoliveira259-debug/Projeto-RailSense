package br.com.railsense_backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.models.Alerta;
import jakarta.persistence.LockModeType;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {
    @Override
    @EntityGraph(attributePaths = "eixo")
    Page<Alerta> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "eixo")
    Page<Alerta> findByStatus(StatusAlerta status, Pageable pageable);

    @EntityGraph(attributePaths = "eixo")
    Page<Alerta> findByEixoId(Long eixoId, Pageable pageable);

    @EntityGraph(attributePaths = "eixo")
    Page<Alerta> findByEixoIdAndStatus(Long eixoId, StatusAlerta status, Pageable pageable);

    /** Trava a linha do alerta até o fim da transação, evitando duas decisões simultâneas. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Alerta a where a.id = :id")
    Optional<Alerta> findByIdForUpdate(Long id);

    /** [status, total] de todos os alertas. */
    @Query("select a.status, count(a) from Alerta a group by a.status")
    List<Object[]> contarPorStatus();

    /** [nível, total] dos alertas em um status. */
    @Query("select a.nivel, count(a) from Alerta a where a.status = :status group by a.nivel")
    List<Object[]> contarPorNivel(StatusAlerta status);

    /** [criadoEm, nível] a partir de um instante; o agrupamento por dia é feito no fuso de quem consulta. */
    @Query("select a.criadoEm, a.nivel from Alerta a where a.criadoEm >= :desde")
    List<Object[]> listarCriadoEmENivelDesde(Instant desde);

    /** Mais graves primeiro e, no mesmo nível, os mais antigos (nível é gravado como texto, sem ordem natural). */
    @EntityGraph(attributePaths = "eixo")
    @Query("""
        select a from Alerta a where a.status = :status
        order by case a.nivel
            when br.com.railsense_backend.enums.NivelAlerta.CRITICO then 0
            when br.com.railsense_backend.enums.NivelAlerta.MEDIO then 1
            else 2 end, a.criadoEm asc""")
    List<Alerta> findPorGravidade(StatusAlerta status, Pageable limite);
}

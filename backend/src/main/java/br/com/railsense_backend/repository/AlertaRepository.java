package br.com.railsense_backend.repository;

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

    /** Trava a linha do alerta até o fim da transação, evitando duas decisões simultâneas. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Alerta a where a.id = :id")
    Optional<Alerta> findByIdForUpdate(Long id);
}

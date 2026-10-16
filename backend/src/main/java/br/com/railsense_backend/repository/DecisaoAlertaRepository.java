package br.com.railsense_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.DecisaoAlerta;

public interface DecisaoAlertaRepository extends JpaRepository<DecisaoAlerta, Long> {
    @EntityGraph(attributePaths = "usuario")
    List<DecisaoAlerta> findByAlertaIdOrderByCriadoEmAsc(Long alertaId);
}

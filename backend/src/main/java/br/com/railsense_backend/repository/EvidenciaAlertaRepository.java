package br.com.railsense_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.EvidenciaAlerta;

public interface EvidenciaAlertaRepository extends JpaRepository<EvidenciaAlerta, Long> {
    @EntityGraph(attributePaths = "imagem")
    List<EvidenciaAlerta> findByAlertaId(Long alertaId);
}

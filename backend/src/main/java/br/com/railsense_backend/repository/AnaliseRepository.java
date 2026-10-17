package br.com.railsense_backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Analise;

public interface AnaliseRepository extends JpaRepository<Analise, Long> {
    List<Analise> findByImagemAtualIdIn(Collection<Long> imagemIds);
}

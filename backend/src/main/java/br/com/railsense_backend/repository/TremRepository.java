package br.com.railsense_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.models.Trem;

public interface TremRepository extends JpaRepository<Trem, Long> {
    boolean existsByCodigoIgnoreCase(String codigo);
}

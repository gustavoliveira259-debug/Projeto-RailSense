package br.com.railsense_backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.models.Sensor;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
    @Override
    @EntityGraph(attributePaths = {"eixo", "eixo.vagao", "eixo.vagao.trem"})
    List<Sensor> findAll();

    List<Sensor> findByEixoIdIn(Collection<Long> eixoIds);

    @EntityGraph(attributePaths = "eixo")
    Optional<Sensor> findByCodigoIgnoreCaseAndTipo(String codigo, TipoSensor tipo);

    boolean existsByCodigoIgnoreCaseAndTipo(String codigo, TipoSensor tipo);
}

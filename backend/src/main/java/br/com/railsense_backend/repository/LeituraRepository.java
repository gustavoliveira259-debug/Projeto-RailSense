package br.com.railsense_backend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.railsense_backend.dto.response.PontoLeitura;
import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.models.Leitura;

public interface LeituraRepository extends JpaRepository<Leitura, Long> {
    /** Projeção leve: a janela de 6 h de um sensor de 1 Hz tem ~21 mil linhas. */
    @Query("""
        select new br.com.railsense_backend.dto.response.PontoLeitura(l.registradoEm, l.valor)
        from Leitura l
        where l.eixo.id = :eixoId and l.tipo = :tipo and l.registradoEm >= :desde
        order by l.registradoEm asc
        """)
    List<PontoLeitura> buscarSerie(Long eixoId, TipoSensor tipo, Instant desde);
}

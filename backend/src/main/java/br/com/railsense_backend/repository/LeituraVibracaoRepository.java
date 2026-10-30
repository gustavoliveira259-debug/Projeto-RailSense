package br.com.railsense_backend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import br.com.railsense_backend.models.LeituraVibracao;

public interface LeituraVibracaoRepository extends JpaRepository<LeituraVibracao, Long> {

    List<LeituraVibracao> findByEixoIdAndCriadoEmAfterOrderByCriadoEmAsc(Long eixoId, Instant desde);

    @Modifying
    @Query("delete from LeituraVibracao l where l.criadoEm < :limite")
    int apagarAnterioresA(Instant limite);
}

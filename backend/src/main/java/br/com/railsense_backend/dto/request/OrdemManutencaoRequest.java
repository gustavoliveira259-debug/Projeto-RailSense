package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.Prioridade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A prioridade é opcional: se ausente, deriva do nível do alerta. */
public record OrdemManutencaoRequest(
    @NotNull Long alertaId,
    @NotBlank @Size(max = 255) String titulo,
    Prioridade prioridade
) {}

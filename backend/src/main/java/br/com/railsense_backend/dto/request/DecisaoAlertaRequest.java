package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.DecisaoTipo;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DecisaoAlertaRequest(
    @NotNull DecisaoTipo decisao,
    @Size(max = 2000) String motivo
) {}

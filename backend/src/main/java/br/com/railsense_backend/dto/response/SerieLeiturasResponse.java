package br.com.railsense_backend.dto.response;

import java.util.List;

import br.com.railsense_backend.enums.TipoSensor;

public record SerieLeiturasResponse(TipoSensor tipo, int minutos, List<PontoLeitura> pontos) {}

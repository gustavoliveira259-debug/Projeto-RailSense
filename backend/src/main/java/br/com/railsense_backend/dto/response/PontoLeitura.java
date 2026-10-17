package br.com.railsense_backend.dto.response;

import java.time.Instant;

public record PontoLeitura(Instant em, double valor) {}

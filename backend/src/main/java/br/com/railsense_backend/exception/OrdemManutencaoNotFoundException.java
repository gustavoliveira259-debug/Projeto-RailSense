package br.com.railsense_backend.exception;

public class OrdemManutencaoNotFoundException extends RuntimeException {
    public OrdemManutencaoNotFoundException(Long id) {
        super("Ordem de manutenção não encontrada: " + id);
    }
}

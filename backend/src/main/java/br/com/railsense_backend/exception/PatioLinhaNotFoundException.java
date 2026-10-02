package br.com.railsense_backend.exception;

public class PatioLinhaNotFoundException extends RuntimeException {
    public PatioLinhaNotFoundException(Long id) {
        super("Pátio/Linha não encontrado: " + id);
    }
}
package br.com.railsense_backend.exception;

public class TremNotFoundException extends RuntimeException {
    public TremNotFoundException(Long id) {
        super("Trem não encontrado: " + id);
    }
}

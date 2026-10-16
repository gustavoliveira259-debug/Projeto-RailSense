package br.com.railsense_backend.exception;

public class AlertaNotFoundException extends RuntimeException {
    public AlertaNotFoundException(Long id) {
        super("Alerta não encontrado: " + id);
    }
}

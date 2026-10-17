package br.com.railsense_backend.exception;

public class ArquivoInvalidoException extends RuntimeException {
    public ArquivoInvalidoException(String message) {
        super(message);
    }
}

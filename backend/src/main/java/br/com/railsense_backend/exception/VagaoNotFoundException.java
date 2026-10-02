package br.com.railsense_backend.exception;

public class VagaoNotFoundException extends RuntimeException {
    public VagaoNotFoundException(Long id) {
        super("Vagão não encontrado: " + id);
    }
}
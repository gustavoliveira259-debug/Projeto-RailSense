package br.com.railsense_backend.exception;

public class EixoNotFoundException extends RuntimeException {
    public EixoNotFoundException(Long id) {
        super("Eixo não encontrado: " + id);
    }
}
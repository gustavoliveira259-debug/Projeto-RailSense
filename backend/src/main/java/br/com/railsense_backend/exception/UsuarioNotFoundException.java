package br.com.railsense_backend.exception;

public class UsuarioNotFoundException extends RuntimeException {
    public UsuarioNotFoundException(Long id) {
        super("Usuário não encontrado: " + id);
    }
}

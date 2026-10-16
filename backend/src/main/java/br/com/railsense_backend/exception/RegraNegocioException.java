package br.com.railsense_backend.exception;

/** Requisição bem formada, mas proibida pelo estado atual do domínio (HTTP 409). */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String message) {
        super(message);
    }
}

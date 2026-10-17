package br.com.railsense_backend.exception;

/** Dados recebidos não atendem a uma regra que a validação do DTO não cobre (HTTP 400). */
public class RequisicaoInvalidaException extends RuntimeException {
    public RequisicaoInvalidaException(String message) {
        super(message);
    }
}

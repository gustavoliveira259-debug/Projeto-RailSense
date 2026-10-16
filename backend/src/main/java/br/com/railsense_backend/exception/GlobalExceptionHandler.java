package br.com.railsense_backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({EixoNotFoundException.class, ImageNotFoundException.class,
            PatioLinhaNotFoundException.class, VagaoNotFoundException.class,
            AlertaNotFoundException.class, OrdemManutencaoNotFoundException.class})
    public ResponseEntity<ApiError> handleNotFound(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ApiError> handleRegraNegocio(RegraNegocioException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
    }

    @ExceptionHandler({CloudinaryUploadException.class, GeminiAnalysisException.class})
    public ResponseEntity<ApiError> handleExternalServiceError(RuntimeException e) {
        // A mensagem ao cliente é genérica; a causa real (status/corpo da API externa) fica no log.
        log.warn("Falha em serviço externo: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ApiError(e.getMessage()));
    }

    public record ApiError(String message) {}
}

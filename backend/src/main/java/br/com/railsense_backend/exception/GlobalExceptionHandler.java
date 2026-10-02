package br.com.railsense_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({EixoNotFoundException.class, ImageNotFoundException.class,
            PatioLinhaNotFoundException.class, VagaoNotFoundException.class})
    public ResponseEntity<ApiError> handleNotFound(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
    }

    @ExceptionHandler({CloudinaryUploadException.class, GeminiAnalysisException.class})
    public ResponseEntity<ApiError> handleExternalServiceError(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ApiError(e.getMessage()));
    }

    public record ApiError(String message) {}
}
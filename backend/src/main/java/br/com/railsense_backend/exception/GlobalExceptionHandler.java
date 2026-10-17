package br.com.railsense_backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final String maxFileSize;

    public GlobalExceptionHandler(@Value("${spring.servlet.multipart.max-file-size}") String maxFileSize) {
        this.maxFileSize = maxFileSize;
    }

    @ExceptionHandler({EixoNotFoundException.class, ImageNotFoundException.class,
            PatioLinhaNotFoundException.class, VagaoNotFoundException.class,
            AlertaNotFoundException.class, OrdemManutencaoNotFoundException.class,
            UsuarioNotFoundException.class, TremNotFoundException.class, SensorNotFoundException.class})
    public ResponseEntity<ApiError> handleNotFound(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(e.getMessage()));
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ApiError> handleRegraNegocio(RegraNegocioException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(e.getMessage()));
    }

    @ExceptionHandler({ArquivoInvalidoException.class, RequisicaoInvalidaException.class})
    public ResponseEntity<ApiError> handleArquivoInvalido(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(e.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleUploadGrande(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
            .body(new ApiError("Arquivo excede o tamanho máximo permitido de " + maxFileSize + "."));
    }

    @ExceptionHandler({CloudinaryUploadException.class, GeminiAnalysisException.class})
    public ResponseEntity<ApiError> handleExternalServiceError(RuntimeException e) {
        // A mensagem ao cliente é genérica; a causa real (status/corpo da API externa) fica no log.
        log.warn("Falha em serviço externo: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ApiError(e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidacao(MethodArgumentNotValidException e) {
        var campo = e.getBindingResult().getFieldError();
        String mensagem = campo != null
            ? "Campo \"" + campo.getField() + "\" inválido: " + campo.getDefaultMessage() + "."
            : "Dados inválidos.";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(mensagem));
    }

    /** Corrida entre duas criações com o mesmo código (as checagens prévias cobrem o caso comum). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegridade(DataIntegrityViolationException e) {
        log.warn("Violação de integridade: {}", e.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ApiError("Registro duplicado ou referência inválida."));
    }

    public record ApiError(String message) {}
}

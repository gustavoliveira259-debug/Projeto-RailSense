package br.com.railsense_backend.exception;

public class CloudinaryUploadException extends RuntimeException {
    public CloudinaryUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}
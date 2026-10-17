package br.com.railsense_backend.exception;

public class SensorNotFoundException extends RuntimeException {
    public SensorNotFoundException(Long id) {
        super("Sensor não encontrado: " + id);
    }
}

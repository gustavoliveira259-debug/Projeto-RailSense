package br.com.railsense_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Reconexão MQTT e limpeza das leituras de vibração antigas. */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}

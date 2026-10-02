package br.com.railsense_backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/** Limite local de tentativas. Em múltiplas instâncias, substitua por Redis/WAF. */
@Service
public class LoginAttemptService {
    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        Attempt attempt = attempts.get(key);
        if (attempt == null) return false;
        if (attempt.expiresAt().isBefore(Instant.now())) {
            attempts.remove(key, attempt);
            return false;
        }
        return attempt.failures() >= MAX_FAILURES;
    }

    public void recordFailure(String key) {
        Instant expiry = Instant.now().plus(WINDOW);
        attempts.compute(key, (ignored, current) -> {
            if (current == null || current.expiresAt().isBefore(Instant.now())) return new Attempt(1, expiry);
            return new Attempt(current.failures() + 1, current.expiresAt());
        });
    }

    public void clear(String key) {
        attempts.remove(key);
    }

    private record Attempt(int failures, Instant expiresAt) {}
}

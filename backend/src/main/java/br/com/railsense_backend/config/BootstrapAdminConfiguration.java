package br.com.railsense_backend.config;

import br.com.railsense_backend.enums.Papel;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapAdminConfiguration {
    @Bean
    CommandLineRunner bootstrapAdmin(UsuarioRepository usuarios, PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.email:}") String email,
            @Value("${app.bootstrap-admin.password:}") String password,
            @Value("${app.bootstrap-admin.name:Administrador RailSense}") String name) {
        return args -> {
            if (email.isBlank() && password.isBlank()) return;
            if (email.isBlank() || password.isBlank() || password.length() < 12) {
                throw new IllegalStateException("ADMIN_EMAIL e ADMIN_PASSWORD (mínimo de 12 caracteres) são obrigatórios juntos.");
            }
            if (usuarios.findByEmailIgnoreCase(email.trim()).isEmpty()) {
                usuarios.save(Usuario.builder().nome(name).email(email.trim().toLowerCase())
                    .hashSenha(passwordEncoder.encode(password)).papel(Papel.ADMIN).ativo(true).build());
            }
        };
    }
}

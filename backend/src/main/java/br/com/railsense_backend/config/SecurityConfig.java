package br.com.railsense_backend.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import br.com.railsense_backend.auth.SessaoAtualizadaFilter;
import br.com.railsense_backend.repository.UsuarioRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            SecurityContextRepository securityContextRepository, UsuarioRepository usuarios) throws Exception {
        var csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(csrfHandler))
            .securityContext(context -> context.securityContextRepository(securityContextRepository))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().changeSessionId())
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; connect-src 'self'"))
                .referrerPolicy(referrer -> referrer.policy(
                    org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)))
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                // Qualquer usuário logado troca a própria senha (exige a senha atual).
                .requestMatchers(HttpMethod.POST, "/api/auth/senha").authenticated()
                // GERENTE e TI: estrutura monitorada (trens, pátios/linhas, vagões, eixos, sensores).
                .requestMatchers(HttpMethod.POST, "/api/trens", "/api/patios-linhas", "/api/vagoes", "/api/eixos",
                        "/api/sensores")
                    .hasAnyRole("GERENTE", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/trens/*/ativo", "/api/vagoes/*/ativo", "/api/eixos/*/ativo",
                        "/api/sensores/*/ativo")
                    .hasAnyRole("GERENTE", "ADMIN")
                // ENGENHEIRO e GERENTE: monitoramento (imagens, baseline, decisão e fechamento de alertas).
                .requestMatchers(HttpMethod.POST, "/api/imagens", "/api/alertas/*/decisao", "/api/alertas/*/fechar")
                    .hasAnyRole("ENGENHEIRO", "GERENTE", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/imagens/*/baseline")
                    .hasAnyRole("ENGENHEIRO", "GERENTE", "ADMIN")
                // ADMIN: gestão de usuários, inclusive a listagem.
                .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                // Consulta liberada a qualquer usuário logado (alertas, histórico, ordens...).
                .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
                // ADMIN: manutenção (POST/PATCH em /api/ordens) e, por padrão seguro, qualquer
                // escrita nova em /api que ainda não tenha regra acima.
                .requestMatchers("/api/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .addFilterBefore(new SessaoAtualizadaFilter(usuarios, securityContextRepository),
                AuthorizationFilter.class)
            // Sem login/logout baseados em redirect: a SPA espera códigos HTTP.
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                // 403 com corpo JSON, no mesmo formato do GlobalExceptionHandler.
                .accessDeniedHandler((request, response, e) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"message\":\"Acesso negado para o seu papel ou sessão.\"}");
                }))
            .logout(logout -> logout
                // Dentro de /api: o proxy do Vite e o nginx só encaminham esse prefixo.
                .logoutUrl("/api/auth/logout")
                .deleteCookies("RAILSENSE_SESSION")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable());

        return http.build();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.security.cors.allowed-origins}") String allowedOrigins) {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}

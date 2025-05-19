package org.avarc.server.backend.config;

import java.io.IOException;

import org.avarc.server.backend.modules.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.debug("Configuring security filter chain");

        // Add debug filter
        http.addFilterBefore(new OncePerRequestFilter() {
            @Override
            @Order(0)
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                log.debug("Debug Filter - Processing request: {} {} (Headers: {})",
                    request.getMethod(),
                    request.getRequestURI(),
                    request.getHeaderNames());
                filterChain.doFilter(request, response);
            }
        }, JwtAuthenticationFilter.class);

        http
            .csrf(csrf -> {
                log.debug("Disabling CSRF protection");
                csrf.disable();
            })
            .sessionManagement(session -> {
                log.debug("Configuring stateless session management");
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
            })
            .authorizeHttpRequests(auth -> {
                log.debug("Configuring request authorization");
                auth
                    .requestMatchers(
                        new AntPathRequestMatcher("/v3/api-docs/**"),
                        new AntPathRequestMatcher("/swagger-ui/**"),
                        new AntPathRequestMatcher("/swagger-ui.html"),
                        new AntPathRequestMatcher("/internal/openapi.json"),
                        new AntPathRequestMatcher("/rest/v0.1.0/auth/**"),
                        new AntPathRequestMatcher("/h2-console/**"),
                        new AntPathRequestMatcher("/h2-database/**")
                    ).permitAll()
                    .anyRequest().authenticated();
            })
            .headers(headers -> {
                log.debug("Configuring security headers");
                headers.frameOptions(frame -> frame.sameOrigin());
            })
            .cors(Customizer.withDefaults());

        log.debug("Adding JWT authentication filter before UsernamePasswordAuthenticationFilter");
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

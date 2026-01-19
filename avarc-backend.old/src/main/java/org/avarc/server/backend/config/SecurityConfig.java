package org.avarc.server.backend.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.avarc.server.backend.modules.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    private static final List<String> PUBLIC_PATHS = Arrays.asList(
        "/v3/api-docs",
        "/swagger-ui",
        "/swagger-ui.html",
        "/internal/openapi.json",
        "/rest/v0.1.0/auth",
        "/h2-console",
        "/h2-database"
    );

    /**
     * TODO: TEMPORARY SECURITY CONFIGURATION
     * Current configuration disables all authentication and authorization checks.
     * This is a temporary measure to resolve 403 issues with API documentation.
     *
     * Items to be fixed:
     * 1. Re-enable proper authentication and authorization
     * 2. Configure proper path matching for public endpoints
     * 3. Implement proper CORS configuration
     * 4. Review and update security headers
     * 5. Consider implementing rate limiting
     * 6. Add proper error handling for authentication failures
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.debug("Configuring security filter chain");

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
                log.debug("Configuring request authorization - TEMPORARILY DISABLED");
                auth.anyRequest().permitAll(); // TEMPORARY: Allow all requests
            })
            .headers(headers -> {
                log.debug("Configuring security headers");
                headers.frameOptions(frame -> frame.sameOrigin());
            })
            .cors(Customizer.withDefaults());

        // Add URL rewriting filter for API docs
        http.addFilterBefore(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                String path = request.getRequestURI();

                // Handle trailing slash for API docs
                if (path.equals("/v3/api-docs/")) {
                    log.debug("Rewriting URL from {} to /v3/api-docs", path);
                    HttpServletRequestWrapper wrapper = new HttpServletRequestWrapper(request) {
                        @Override
                        public String getRequestURI() {
                            return "/v3/api-docs";
                        }
                    };
                    filterChain.doFilter(wrapper, response);
                    return;
                }

                filterChain.doFilter(request, response);
            }
        }, UsernamePasswordAuthenticationFilter.class);

        // Add bypass filter after security configuration
        http.addFilterBefore(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                String path = request.getRequestURI();
                log.debug("Bypass Filter - Processing request: {} {}",
                    request.getMethod(),
                    path);

                // Set CORS headers for all requests
                response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
                response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, PUT, DELETE, OPTIONS");
                response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "Authorization, Content-Type");

                // Clear security context for all requests
                SecurityContextHolder.clearContext();

                filterChain.doFilter(request, response);
            }
        }, UsernamePasswordAuthenticationFilter.class);

        // Add JWT filter after security configuration
        log.debug("Adding JWT authentication filter");
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

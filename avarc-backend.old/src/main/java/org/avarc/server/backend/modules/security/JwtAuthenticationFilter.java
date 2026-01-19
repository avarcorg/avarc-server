package org.avarc.server.backend.modules.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private static final List<String> PUBLIC_PATHS = Arrays.asList(
        "/v3/api-docs",
        "/swagger-ui",
        "/swagger-ui.html",
        "/internal/openapi.json",
        "/rest/v0.1.0/auth",
        "/h2-console",
        "/h2-database"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean shouldNotFilter = PUBLIC_PATHS.stream()
            .anyMatch(publicPath -> path.startsWith(publicPath));

        log.debug("JWT Filter - Request path: {}, shouldNotFilter: {} (matches public path: {})",
            path,
            shouldNotFilter,
            shouldNotFilter ? PUBLIC_PATHS.stream()
                .filter(publicPath -> path.startsWith(publicPath))
                .findFirst()
                .orElse("none") : "none");

        return shouldNotFilter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        log.debug("JWT Filter - Processing request: {} {} (Auth header: {})",
            request.getMethod(),
            request.getRequestURI(),
            authHeader != null ? "present" : "missing");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("JWT Filter - No valid Bearer token found, proceeding without authentication");
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username = jwtService.extractUsername(jwt);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtService.isTokenValid(jwt, username)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of() // Empty authorities for now
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("JWT Filter - Authentication successful for user: {}", username);
            } else {
                log.debug("JWT Filter - Token validation failed for user: {}", username);
            }
        }

        filterChain.doFilter(request, response);
    }
}

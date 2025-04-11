package org.avarc.server.backend.modules.security;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.avarc.server.backend.modules.user.api.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration.ms:86400000}") // Default: 24h
    private long expirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public UUID extractUuid(String token) {
        return extractClaim(token, claims -> UUID.fromString(claims.get("uuid", String.class)));
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            JwtParser parser = Jwts.parser().verifyWith(getSigningKey()).build();
            return parser.parseSignedClaims(token).getPayload();
        } catch (SignatureException e) {
            throw new RuntimeException("Invalid JWT signature", e);
        }
    }

    public List<Role> extractRoles(String token) {
        return extractClaim(token, claims -> {
            List<String> roles = claims.get("roles", List.class);
            return roles != null
                ? roles.stream().map(Role::valueOf).toList()
                : List.of();
        });
    }

    public String generateToken(String username, UUID uuid, List<Role> roles) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .subject(username)
            .claim("uuid", uuid.toString())
            .claim("roles", roles)
            .issuedAt(new Date(now))
            .expiration(new Date(now + expirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    public boolean isTokenValid(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username)) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}

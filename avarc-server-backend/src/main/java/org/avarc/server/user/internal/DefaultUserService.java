package org.avarc.server.user.internal;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.avarc.server.auth.LoginSucceeded;
import org.avarc.server.user.User;
import org.avarc.server.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
class DefaultUserService implements UserService {

    private static final Logger LOG = LoggerFactory.getLogger(DefaultUserService.class);

    private final UserRepository users;
    private final TransactionTemplate transaction;

    DefaultUserService(UserRepository users, TransactionTemplate transaction) {
        this.users = users;
        this.transaction = transaction;
    }

    /** Creates or refreshes the user at a login; a failure is logged and never blocks the login. */
    @EventListener
    void onLogin(LoginSucceeded login) {
        try {
            upsert(
                    login.subject(),
                    new UserClaims(
                            login.username(), login.email(), login.firstName(), login.lastName(), login.displayName()),
                    true,
                    Map.of());
        } catch (RuntimeException e) {
            LOG.error("Could not store the user of a login", e);
        }
    }

    @Override
    public User currentUser(String subject, UserClaims claims) {
        return upsert(subject, claims, false, Map.of());
    }

    @Override
    public User updatePreferences(String subject, UserClaims claims, Map<String, Object> changes) {
        Preferences.validate(changes);
        return upsert(subject, claims, false, changes);
    }

    /** Idempotent: a concurrent first login that loses the race on the unique subject reads the winner. */
    private User upsert(String subject, UserClaims claims, boolean login, Map<String, Object> changes) {
        try {
            return transaction.execute(status -> apply(subject, claims, login, changes));
        } catch (DataIntegrityViolationException e) {
            return transaction.execute(status -> apply(subject, claims, login, changes));
        }
    }

    private User apply(String subject, UserClaims claims, boolean login, Map<String, Object> changes) {
        Instant now = Instant.now();
        UserEntity existing = users.findBySubject(subject).orElse(null);
        UserEntity user = existing != null ? existing : new UserEntity(subject, now);
        if (login || existing == null) {
            user.username = claims.username();
            user.email = claims.email();
            user.firstName = claims.firstName();
            user.lastName = claims.lastName();
            user.displayName = claims.displayName();
        }
        if (login) {
            user.lastLoginAt = now;
        }
        if (!changes.isEmpty()) {
            Map<String, Object> merged = new LinkedHashMap<>(user.preferences);
            merged.putAll(changes);
            user.preferences = merged;
        }
        users.saveAndFlush(user);
        return new User(
                user.id,
                user.username,
                user.email,
                user.firstName,
                user.lastName,
                user.displayName,
                Map.copyOf(user.preferences));
    }
}

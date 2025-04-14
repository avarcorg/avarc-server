package org.avarc.server.backend.modules.authentication.internal;

import org.avarc.server.backend.modules.i18n.MessageService;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthMessageService {
    private final MessageService messageService;

    public String getRegisterErrorUsernameExists(String username) {
        return messageService.getMessage("auth.register.error.username.exists", new Object[]{username});
    }

    public String getLoginSuccess() {
        return messageService.getMessage("auth.login.success");
    }

    public String getLoginError() {
        return messageService.getMessage("auth.login.error");
    }

    public String getRegisterSuccess() {
        return messageService.getMessage("auth.register.success");
    }

    public String getRegisterErrorUsernameExists() {
        return messageService.getMessage("auth.register.error.username.exists");
    }

    public String getRegisterError() {
        return messageService.getMessage("auth.register.error");
    }

    public String getLogoutSuccess() {
        return messageService.getMessage("auth.logout.success");
    }

    public String getTokenInvalid() {
        return messageService.getMessage("auth.token.invalid");
    }

    public String getTokenExpired() {
        return messageService.getMessage("auth.token.expired");
    }

    public String getTokenMissing() {
        return messageService.getMessage("auth.token.missing");
    }

    public String getCredentialsInvalid() {
        return messageService.getMessage("auth.credentials.invalid");
    }
}

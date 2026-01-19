package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.i18n.MessageService;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserMessageService {
    private final MessageService messageService;

    public String getUserNotFound(String username) {
        return messageService.getMessage("user.not.found", new Object[]{username});
    }

    public String getUserNotFoundByUuid(String uuid) {
        return messageService.getMessage("user.not.found.uuid", new Object[]{uuid});
    }

    public String getUsernameAlreadyExists(String username) {
        return messageService.getMessage("auth.register.error.username.exists", new Object[]{username});
    }

    public String getUpdateSuccess() {
        return messageService.getMessage("user.update.success");
    }

    public String getUpdateError() {
        return messageService.getMessage("user.update.error");
    }

    public String getCreateSuccess() {
        return messageService.getMessage("user.create.success");
    }

    public String getCreateError() {
        return messageService.getMessage("user.create.error");
    }
}

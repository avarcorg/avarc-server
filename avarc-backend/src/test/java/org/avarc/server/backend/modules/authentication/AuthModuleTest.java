package org.avarc.server.backend.modules.authentication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.avarc.server.backend.modules.user.api.UserApi;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.internal.UserMapper;
import org.avarc.server.backend.modules.user.internal.UserMessageService;
import org.avarc.server.backend.modules.user.internal.UserRepository;
import org.avarc.server.backend.modules.user.internal.UserService;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

@Tag("modulith")
class AuthModuleTest {

    @Test
    void verifyUserDtoExposedViaApi() {
        UserRepository repo = mock(UserRepository.class);
        UserMapper mapper = UserMapper.INSTANCE;
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserMessageService messageService = mock(UserMessageService.class);

        UserApi api = new UserService(repo, mapper, encoder, messageService);
        UserDto dto = api.createSampleUser();

        assertThat(dto).isNotNull();
        assertThat(dto.getUsername()).isEqualTo("sample-from-api");
    }
}

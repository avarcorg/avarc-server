package org.avarc.server.backend.modules.authentication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.avarc.server.backend.modules.user.api.UserApi;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.internal.UserMapper;
import org.avarc.server.backend.modules.user.internal.UserRepository;
import org.avarc.server.backend.modules.user.internal.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthModuleTest {

    @Test
    void verifyUserDtoExposedViaApi() {
        UserRepository repo = mock(UserRepository.class);
        UserMapper mapper = new UserMapper(); // plain Java version — safe to use directly
        PasswordEncoder encoder = mock(PasswordEncoder.class);

        UserApi api = new UserService(repo, mapper, encoder);
        UserDto dto = api.createSampleUser();

        assertThat(dto).isNotNull();
        assertThat(dto.getUsername()).isEqualTo("sample-from-api");
    }
}

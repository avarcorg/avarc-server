package org.avarc.server.backend.modules.authentication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.avarc.server.backend.modules.user.api.UserApi;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.internal.UserRepository;
import org.avarc.server.backend.modules.user.internal.UserService;
import org.junit.jupiter.api.Test;

class AuthModuleTest {

    @Test
    void verifyUserDtoExposedViaApi() {
        UserRepository repo = mock(UserRepository.class);
        UserApi api = new UserService(repo);
        UserDto dto = api.createSampleUser();
        assertThat(dto).isNotNull();
    }
}

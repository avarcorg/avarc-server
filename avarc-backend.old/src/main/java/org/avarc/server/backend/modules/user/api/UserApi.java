package org.avarc.server.backend.modules.user.api;

/**
 * This forces Spring Modulith to detect UserDto as a public, exposed, Spring-connected type.
 */
@Deprecated(forRemoval = true)
public interface UserApi {
    UserDto createSampleUser();
}

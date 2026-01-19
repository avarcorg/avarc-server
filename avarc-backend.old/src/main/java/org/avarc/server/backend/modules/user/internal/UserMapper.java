package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants.ComponentModel;
import org.mapstruct.factory.Mappers;

/**
 * Maps between User entity and UserDto.
 *
 * SECURITY NOTE: The password field should never be mapped from Entity to DTO.
 * If mapping from DTO to Entity is necessary (e.g., for user creation or password change),
 * this should be explicitly handled in the appropriate controller or service class.
 */
@Mapper(componentModel = ComponentModel.SPRING)
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(target = "password", ignore = true)
    UserDto toDto(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    User toEntity(UserDto dto);
}

package org.avarc.server.backend.modules.security;

import org.springframework.modulith.ApplicationModule;

@ApplicationModule(allowedDependencies = {"modules.authentication", "modules.user"})
class ModuleInfo {
}

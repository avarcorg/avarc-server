package org.avarc.server.backend.modules.authentication;

import org.springframework.modulith.ApplicationModule;

@ApplicationModule(allowedDependencies = { "modules.user", "modules.security" })
class ModuleInfo {
}

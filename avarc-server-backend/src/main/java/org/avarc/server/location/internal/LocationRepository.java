package org.avarc.server.location.internal;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface LocationRepository extends JpaRepository<LocationEntity, UUID> {}

package org.avarc.server.location.internal;

import org.springframework.data.jpa.repository.JpaRepository;

interface TagRepository extends JpaRepository<TagEntity, String> {}

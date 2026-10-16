package org.avarc.server.location.internal;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface TagRepository extends JpaRepository<TagEntity, String> {

    interface Usage {
        String getKey();

        long getLocations();
    }

    @Query(
            value = "SELECT t.key AS key, count(lt.location_id) AS locations FROM {h-schema}tag t"
                    + " LEFT JOIN {h-schema}location_tag lt ON lt.tag_key = t.key GROUP BY t.key",
            nativeQuery = true)
    List<Usage> usage();
}

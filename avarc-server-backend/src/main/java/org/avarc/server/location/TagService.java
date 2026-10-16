package org.avarc.server.location;

import java.util.List;
import java.util.Map;

/** Lists the tags, and sets the labels of one. Tags are created by using a key on a location. */
public interface TagService {

    List<TagSummary> list();

    /** Creates the tag or replaces its labels; the key is normalised like the keys on a location. */
    TagSummary setLabels(String key, Map<String, String> labels);
}

package org.avarc.server.location.internal;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.avarc.server.location.InvalidLocationException;
import org.avarc.server.location.TagService;
import org.avarc.server.location.TagSummary;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Everyone logged in lists the tags; only an admin sets labels. Tags are created by using a key. */
@RestController
@RequestMapping("/api/tags")
@Tag(name = "tags", description = "Tags of locations and their labels")
class TagController {

    private final TagService tags;

    TagController(TagService tags) {
        this.tags = tags;
    }

    @Operation(summary = "All tags, with the number of locations that carry each")
    @GetMapping
    List<TagSummary> list() {
        return tags.list();
    }

    @Operation(summary = "Creates a tag or replaces its labels")
    @PreAuthorize("hasRole('admin')")
    @PutMapping("/{key}")
    TagSummary setLabels(@PathVariable String key, @RequestBody Labels body) {
        return tags.setLabels(key, body.labels());
    }

    @ExceptionHandler(InvalidLocationException.class)
    ProblemDetail invalid(InvalidLocationException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    record Labels(Map<String, String> labels) {}
}

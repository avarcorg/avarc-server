package org.avarc.server.location.internal;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.util.UUID;
import org.avarc.server.location.InvalidLocationException;
import org.avarc.server.location.Location;
import org.avarc.server.location.LocationInput;
import org.avarc.server.location.LocationNotFoundException;
import org.avarc.server.location.LocationPage;
import org.avarc.server.location.LocationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Reading needs a login (every user is a viewer); changing needs editor or admin. */
@RestController
@RequestMapping("/api/locations")
@Tag(name = "locations", description = "Locations of historical importance")
class LocationController {

    private static final String EDITOR = "hasAnyRole('editor', 'admin')";

    private final LocationService locations;

    LocationController(LocationService locations) {
        this.locations = locations;
    }

    @Operation(summary = "A page of locations, newest first")
    @GetMapping
    LocationPage list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return locations.list(page, size);
    }

    @Operation(summary = "One location")
    @GetMapping("/{id}")
    Location get(@PathVariable UUID id) {
        return locations.get(id);
    }

    @Operation(summary = "Creates a location")
    @PreAuthorize(EDITOR)
    @PostMapping
    ResponseEntity<Location> create(@RequestBody LocationInput input, @AuthenticationPrincipal OidcUser principal) {
        Location created = locations.create(input, principal.getSubject());
        return ResponseEntity.created(URI.create("/api/locations/" + created.id()))
                .body(created);
    }

    @Operation(summary = "Replaces the content of a location")
    @PreAuthorize(EDITOR)
    @PutMapping("/{id}")
    Location update(
            @PathVariable UUID id, @RequestBody LocationInput input, @AuthenticationPrincipal OidcUser principal) {
        return locations.update(id, input, principal.getSubject());
    }

    @Operation(summary = "Deletes a location")
    @PreAuthorize(EDITOR)
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        locations.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(InvalidLocationException.class)
    ProblemDetail invalid(InvalidLocationException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(LocationNotFoundException.class)
    ProblemDetail notFound(LocationNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }
}

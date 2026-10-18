export type DeveloperLinkId = "database" | "keycloak" | "swagger" | "openapi";
export type DeveloperLink = { id: DeveloperLinkId; href: string; label: string };

// The footer links of the non-prod environments. They are read from the
// environment of the running server, not at build time, because the image is
// the same everywhere; unset or empty means no link.
export function developerLinks(labels: {
  database: string;
  keycloak: string;
  swagger: string;
  openapi: string;
}): DeveloperLink[] {
  const links: DeveloperLink[] = [];
  const database = process.env.FOOTER_DBTOOL_URL;
  if (database) {
    links.push({ id: "database", href: database, label: labels.database });
  }
  const keycloak = process.env.FOOTER_KEYCLOAK_URL;
  if (keycloak) {
    links.push({ id: "keycloak", href: keycloak, label: labels.keycloak });
  }
  if (process.env.FOOTER_API_DOCS === "true") {
    links.push({ id: "swagger", href: "/api/docs", label: labels.swagger });
    links.push({ id: "openapi", href: "/api/docs/openapi.json", label: labels.openapi });
  }
  return links;
}

// The actuator is served wherever the API links are (dev and stage), so the
// application index lists it on the same condition; the footer does not.
export function actuatorEnabled(): boolean {
  return process.env.FOOTER_API_DOCS === "true";
}

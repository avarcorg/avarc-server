export type DeveloperLink = { href: string; label: string };

// The footer links of the non-prod environments. They are read from the
// environment of the running server, not at build time, because the image is
// the same everywhere; unset or empty means no link.
export function developerLinks(labels: {
  database: string;
  swagger: string;
  openapi: string;
}): DeveloperLink[] {
  const links: DeveloperLink[] = [];
  const database = process.env.FOOTER_DBTOOL_URL;
  if (database) {
    links.push({ href: database, label: labels.database });
  }
  if (process.env.FOOTER_API_DOCS === "true") {
    links.push({ href: "/api/docs", label: labels.swagger });
    links.push({ href: "/api/docs/openapi.json", label: labels.openapi });
  }
  return links;
}

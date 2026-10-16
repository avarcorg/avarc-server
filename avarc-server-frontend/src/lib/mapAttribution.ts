// The attribution the OpenStreetMap tiles require; the product name and the
// word after the link are translations.
export function mapAttribution(provider: string, contributors: string): string {
  return `&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">${provider}</a> ${contributors}`;
}

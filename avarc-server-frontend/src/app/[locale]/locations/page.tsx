import { getTranslations } from "next-intl/server";
import { Link, redirect } from "../../../i18n/navigation";
import { LocationMapLoader } from "../../../components/LocationMapLoader";
import type { MapPoint } from "../../../components/LocationMap";
import { allLocations, NotLoggedIn, pick, tagLabel, type Location } from "../../../lib/locations";
import { canEdit, currentUser } from "../../../lib/session";

export default async function Locations({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await currentUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }
  let locations: Location[] = [];
  try {
    locations = await allLocations();
  } catch (error) {
    if (error instanceof NotLoggedIn) {
      redirect({ href: "/login", locale });
    }
    throw error;
  }
  const t = await getTranslations("Locations");

  const rows = locations.map((location) => {
    const text = pick(location.translations, locale);
    return { location, text };
  });
  rows.sort((a, b) => (a.text?.value.name ?? "").localeCompare(b.text?.value.name ?? "", locale));
  const points: MapPoint[] = rows.flatMap(({ location, text }) =>
    location.position.kind === "point" &&
    location.position.latitude !== null &&
    location.position.longitude !== null
      ? [
          {
            id: location.id,
            latitude: location.position.latitude,
            longitude: location.position.longitude,
            name: text?.value.name ?? location.id,
          },
        ]
      : [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
        {canEdit(user) && (
          <Link
            href="/locations/new"
            className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink transition hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("new")}
          </Link>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LocationMapLoader points={points} label={t("mapLabel")} />
        </div>
        <section aria-labelledby="list-heading" className="lg:max-h-96 lg:overflow-y-auto">
          <h2 id="list-heading" className="mb-2 text-sm font-medium text-muted">
            {t("count", { count: rows.length })}
          </h2>
          {rows.length === 0 ? (
            <p className="text-muted">{t("empty")}</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg bg-surface ring-1 ring-line">
              {rows.map(({ location, text }) => (
                <li key={location.id}>
                  <Link
                    href={`/locations/${location.id}`}
                    className="block px-3 py-2 hover:bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="font-medium">{text?.value.name ?? location.id}</span>
                    {text?.fallback && (
                      <span className="ml-2 text-xs text-muted">({t("notTranslated")})</span>
                    )}
                    {text?.value.periodLabel && (
                      <span className="block text-sm text-muted">{text.value.periodLabel}</span>
                    )}
                    {location.tags.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {location.tags.map((tag) => (
                          <span
                            key={tag.key}
                            className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-soft-ink"
                          >
                            {tagLabel(tag, locale)}
                          </span>
                        ))}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "../../../../i18n/navigation";
import { LocationMapLoader } from "../../../../components/LocationMapLoader";
import {
  NotFound,
  NotLoggedIn,
  oneLocation,
  pick,
  tagLabel,
  yearOf,
  type Location,
} from "../../../../lib/locations";
import { currentUser } from "../../../../lib/session";

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!(await currentUser())) {
    redirect({ href: "/login", locale });
  }
  let location: Location;
  try {
    location = await oneLocation(id);
  } catch (error) {
    if (error instanceof NotLoggedIn) {
      redirect({ href: "/login", locale });
    }
    if (error instanceof NotFound) {
      notFound();
    }
    throw error;
  }
  const t = await getTranslations("Locations");
  const text = pick(location.translations, locale);
  const name = text?.value.name ?? location.id;

  const era = (year: number | null) =>
    year === null ? null : year < 0 ? t("bce", { year: -year }) : t("ce", { year });
  const start = era(yearOf(location.periodStart));
  const end = era(yearOf(location.periodEnd));
  const bounds = start && end ? `${start} – ${end}` : (start ?? end);
  const { latitude, longitude } = location.position;
  const hasPoint = location.position.kind === "point" && latitude !== null && longitude !== null;

  return (
    <article className="space-y-6">
      <p>
        <Link href="/locations" className="text-sm text-muted underline hover:text-accent">
          {t("back")}
        </Link>
      </p>
      <header>
        <h1 className="font-heading text-3xl font-semibold">{name}</h1>
        {text?.fallback && (
          <p className="mt-1 text-sm text-muted">
            {t("notTranslatedIn", { language: text.language })}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {text && <p className="whitespace-pre-line">{text.value.description}</p>}

          {location.tags.length > 0 && (
            <ul aria-label={t("tags")} className="flex flex-wrap gap-1">
              {location.tags.map((tag) => (
                <li
                  key={tag.key}
                  className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-soft-ink"
                >
                  {tagLabel(tag, locale)}
                </li>
              ))}
            </ul>
          )}

          {location.references.length > 0 && (
            <section aria-labelledby="references-heading">
              <h2 id="references-heading" className="font-heading text-xl font-semibold">
                {t("references")}
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {location.references.map((reference, index) => {
                  const citation = pick(reference.citations, locale);
                  return (
                    <li key={index}>
                      {citation?.value}
                      {citation?.fallback && (
                        <span className="ml-1 text-xs text-muted">({citation.language})</span>
                      )}
                      {reference.url && (
                        <>
                          {" "}
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-accent underline"
                          >
                            {reference.url}
                          </a>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {(text?.value.periodLabel || bounds) && (
              <>
                <dt className="text-muted">{t("period")}</dt>
                <dd>
                  {[text?.value.periodLabel, bounds].filter(Boolean).join(" · ")}
                </dd>
              </>
            )}
            <dt className="text-muted">{t("confidence")}</dt>
            <dd>{t("confidenceValue", { level: location.confidenceLevel })}</dd>
            {text && (
              <>
                <dt className="text-muted">{t("confidenceText")}</dt>
                <dd>{t("confidenceValue", { level: text.value.confidenceLevel })}</dd>
              </>
            )}
            {hasPoint && (
              <>
                <dt className="text-muted">{t("position")}</dt>
                <dd>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </dd>
              </>
            )}
          </dl>
          {hasPoint && (
            <LocationMapLoader
              points={[{ id: location.id, latitude, longitude, name }]}
              label={t("mapLabel")}
              linked={false}
              className="h-64"
            />
          )}
        </div>
      </div>
    </article>
  );
}

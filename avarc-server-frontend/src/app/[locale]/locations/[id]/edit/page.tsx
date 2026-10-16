import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "../../../../../i18n/navigation";
import { routing } from "../../../../../i18n/routing";
import { LocationForm } from "../../../../../components/LocationForm";
import {
  allTags,
  NotFound,
  NotLoggedIn,
  oneLocation,
  pick,
  type Location,
  type TagSummary,
} from "../../../../../lib/locations";
import { formFromLocation } from "../../../../../lib/locationModel";
import { canEdit, currentUser } from "../../../../../lib/session";

export default async function EditLocation({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await currentUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }
  if (!canEdit(user)) {
    redirect({ href: `/locations/${id}`, locale });
  }
  let location: Location;
  let tags: TagSummary[];
  try {
    [location, tags] = await Promise.all([oneLocation(id), allTags()]);
  } catch (error) {
    if (error instanceof NotLoggedIn) {
      redirect({ href: "/login", locale });
    }
    if (error instanceof NotFound) {
      notFound();
    }
    throw error;
  }
  const t = await getTranslations("Form");
  const languages = [...routing.locales];
  const name = pick(location.translations, locale)?.value.name ?? location.id;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p>
        <Link href={`/locations/${id}`} className="text-sm text-muted underline hover:text-accent">
          {name}
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-semibold">{t("editTitle")}</h1>
      <LocationForm
        id={id}
        initial={formFromLocation(location, languages)}
        languages={languages}
        tags={tags}
        csrfToken={user?.csrfToken ?? ""}
      />
    </div>
  );
}

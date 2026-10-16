import { getTranslations } from "next-intl/server";
import { Link, redirect } from "../../../../i18n/navigation";
import { routing } from "../../../../i18n/routing";
import { LocationForm } from "../../../../components/LocationForm";
import { allTags, NotLoggedIn, type TagSummary } from "../../../../lib/locations";
import { emptyForm } from "../../../../lib/locationModel";
import { canEdit, currentUser } from "../../../../lib/session";

export default async function NewLocation({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await currentUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }
  if (!canEdit(user)) {
    redirect({ href: "/locations", locale });
  }
  let tags: TagSummary[] = [];
  try {
    tags = await allTags();
  } catch (error) {
    if (error instanceof NotLoggedIn) {
      redirect({ href: "/login", locale });
    }
    throw error;
  }
  const t = await getTranslations("Form");
  const languages = [...routing.locales];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p>
        <Link href="/locations" className="text-sm text-muted underline hover:text-accent">
          {(await getTranslations("Locations"))("back")}
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-semibold">{t("newTitle")}</h1>
      <LocationForm
        initial={emptyForm(languages)}
        languages={languages}
        tags={tags}
        csrfToken={user?.csrfToken ?? ""}
      />
    </div>
  );
}

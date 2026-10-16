import { getTranslations } from "next-intl/server";
import { redirect } from "../../../i18n/navigation";
import { routing } from "../../../i18n/routing";
import { TagLabelsForm } from "../../../components/TagLabelsForm";
import { allTags, NotLoggedIn, type TagSummary } from "../../../lib/locations";
import { currentUser, isAdmin } from "../../../lib/session";

export default async function Tags({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await currentUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }
  if (!isAdmin(user)) {
    redirect({ href: "/", locale });
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
  const t = await getTranslations("Tags");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted">{t("intro")}</p>
      <TagLabelsForm tags={tags} languages={[...routing.locales]} csrfToken={user?.csrfToken ?? ""} />
    </div>
  );
}

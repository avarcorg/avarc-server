import { getTranslations } from "next-intl/server";
import { redirect } from "../../i18n/navigation";
import { currentUser } from "../../lib/session";
import { AuthCard } from "../../components/AuthCard";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await currentUser();
  if (!user) {
    redirect({ href: "/login", locale });
  }
  const t = await getTranslations("Home");
  return (
    <AuthCard title={t("title")}>
      <p>
        {t("signedInAs")}{" "}
        <strong className="text-ink">{user?.name ?? user?.username}</strong>
        <span className="ml-2 inline-flex gap-1 align-middle">
          {user?.roles.map((role) => (
            <span
              key={role}
              className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-ink"
            >
              {role}
            </span>
          ))}
        </span>
      </p>
    </AuthCard>
  );
}

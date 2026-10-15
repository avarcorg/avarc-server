import { getTranslations } from "next-intl/server";
import { AuthCard, buttonClass } from "../../../components/AuthCard";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("Login");
  return (
    <AuthCard title={t("title")}>
      <p>{t("intro")}</p>
      {error !== undefined && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink ring-1 ring-danger-line"
        >
          {t("failed")}
        </p>
      )}
      <a href="/api/auth/login/keycloak" className={buttonClass}>
        {t("action")}
      </a>
    </AuthCard>
  );
}

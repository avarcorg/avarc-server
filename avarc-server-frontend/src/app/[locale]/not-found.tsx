import { getTranslations } from "next-intl/server";
import { AuthCard, buttonClass } from "../../components/AuthCard";
import { Link } from "../../i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Errors");
  return (
    <AuthCard title={t("notFoundTitle")}>
      <p>{t("notFoundMessage")}</p>
      <Link href="/" className={buttonClass}>
        {t("home")}
      </Link>
    </AuthCard>
  );
}

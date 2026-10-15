import { getTranslations } from "next-intl/server";
import { AuthCard, buttonClass } from "../../../components/AuthCard";
import { Link } from "../../../i18n/navigation";

export default async function LoggedOut() {
  const t = await getTranslations("LoggedOut");
  return (
    <AuthCard title={t("title")}>
      <p>{t("message")}</p>
      <Link href="/login" className={buttonClass}>
        {t("again")}
      </Link>
    </AuthCard>
  );
}

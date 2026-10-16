"use client";

import { useTranslations } from "next-intl";
import { AuthCard, buttonClass } from "../../components/AuthCard";

// Shown when a page fails, for example when the backend cannot be reached.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Errors");
  return (
    <AuthCard title={t("title")}>
      <p>{t("message")}</p>
      <button type="button" onClick={reset} className={buttonClass}>
        {t("retry")}
      </button>
    </AuthCard>
  );
}

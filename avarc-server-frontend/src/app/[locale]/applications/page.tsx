import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AuthCard } from "../../../components/AuthCard";
import { Link } from "../../../i18n/navigation";
import { actuatorEnabled, developerLinks } from "../../../lib/developerLinks";

// The environment decides what is listed, at run time.
export const dynamic = "force-dynamic";

export default async function Applications({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Applications");
  const frame = await getTranslations("Frame");
  const products = await getTranslations("Products");
  const entries: Entry[] = developerLinks({
    database: frame("linkDatabase"),
    keycloak: frame("linkKeycloak", { product: products("keycloak") }),
    swagger: frame("linkSwagger", { product: products("swaggerUi") }),
    openapi: frame("linkOpenapi"),
  }).map((link) => ({ ...link, description: t(`description.${link.id}`) }));
  if (actuatorEnabled()) {
    entries.push({
      id: "actuator",
      href: "/actuator",
      label: t("actuator"),
      description: t("description.actuator"),
    });
  }
  // Without a tool to list, the website is the only entry and there is no
  // point in a page (prod).
  if (entries.length === 0) {
    notFound();
  }
  return (
    <AuthCard title={t("title")}>
      <p>{t("intro")}</p>
      <ul className="mt-4 space-y-3">
        <li>
          <Link href="/" className={linkClass}>
            {frame("siteName")}
          </Link>
          <p className="text-sm text-muted">{t("description.site")}</p>
        </li>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a href={entry.href} className={linkClass}>
              {entry.label}
            </a>
            <p className="text-sm text-muted">{entry.description}</p>
          </li>
        ))}
      </ul>
    </AuthCard>
  );
}

type Entry = { id: string; href: string; label: string; description: string };

const linkClass =
  "font-medium underline hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

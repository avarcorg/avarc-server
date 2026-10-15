import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFrame } from "../../components/SiteFrame";
import { routing } from "../../i18n/routing";
import { currentUser } from "../../lib/session";
import "../globals.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Frame" });
  return { title: t("siteName"), description: t("tagline") };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  // The public pages must render when the backend is not reachable.
  const user = await currentUser().catch(() => null);
  return (
    <html lang={locale}>
      <body className="bg-page text-ink antialiased">
        <NextIntlClientProvider>
          <SiteFrame user={user}>{children}</SiteFrame>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

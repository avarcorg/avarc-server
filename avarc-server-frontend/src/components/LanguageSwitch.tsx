"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "../i18n/navigation";
import { routing } from "../i18n/routing";

// One link per language, to the same page in that language.
export function LanguageSwitch({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <ul aria-label={label} className="flex items-center gap-1 text-sm">
      {routing.locales.map((locale) => (
        <li key={locale}>
          <Link
            href={pathname}
            locale={locale}
            lang={locale}
            hrefLang={locale}
            aria-current={locale === current ? "true" : undefined}
            className="rounded-md px-2 py-1 font-medium uppercase text-muted transition hover:bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-[current=true]:text-accent"
          >
            {locale}
          </Link>
        </li>
      ))}
    </ul>
  );
}

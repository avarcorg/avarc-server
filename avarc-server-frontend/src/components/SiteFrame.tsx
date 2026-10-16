import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "../i18n/navigation";
import { isAdmin, type Me } from "../lib/session";
import { developerLinks } from "../lib/developerLinks";
import { LanguageSwitch } from "./LanguageSwitch";
import { NavMenu } from "./NavMenu";

// The frame of every page: a top bar, the content, a footer. The navigation
// and the user menu are only there with a session. A page that needs the
// whole width (the map) passes wide.
export async function SiteFrame({
  user,
  wide = false,
  children,
}: {
  user: Me | null;
  wide?: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations("Frame");
  const nav = await getTranslations("Nav");
  const devLinks = developerLinks({
    database: t("linkDatabase"),
    keycloak: t("linkKeycloak"),
    swagger: t("linkSwagger"),
    openapi: t("linkOpenapi"),
  });
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:ring-2 focus:ring-accent"
      >
        {t("skipToContent")}
      </a>
      <header className="relative border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
          <Link
            href="/"
            className="font-heading text-xl font-semibold tracking-wide text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("siteName")}
          </Link>
          {user && (
            <NavMenu
              label={t("navigation")}
              menuLabel={t("menu")}
              items={[
                { href: "/", label: nav("home") },
                { href: "/locations", label: nav("locations") },
                ...(isAdmin(user) ? [{ href: "/tags", label: nav("tags") }] : []),
              ]}
            />
          )}
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitch label={t("language")} />
            {user && (
              <details className="relative">
                <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-sm font-medium hover:bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <span className="sr-only">{t("userMenu")}: </span>
                  {user.name ?? user.username}
                </summary>
                <form
                  method="post"
                  action="/api/auth/logout"
                  className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg bg-surface p-1 shadow-lg ring-1 ring-line"
                >
                  <input type="hidden" name="_csrf" value={user.csrfToken} />
                  <button
                    type="submit"
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {t("logout")}
                  </button>
                </form>
              </details>
            )}
          </div>
        </div>
      </header>
      <main
        id="content"
        className={`mx-auto w-full flex-1 px-4 py-8 ${wide ? "" : "max-w-6xl"}`}
      >
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-sm text-muted">
          <p>{t("tagline")}</p>
          {devLinks.length > 0 && (
            <nav aria-label={t("devLinks")} className="ml-auto">
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {devLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </footer>
    </div>
  );
}

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// A text that a language lacks is taken from the default language, so a page
// is never blank while a translation is still missing.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const fallback = (await import(`../../messages/${routing.defaultLocale}.json`)).default;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages: merge(fallback, messages) };
});

type Messages = { [key: string]: string | Messages };

function merge(base: Messages, over: Messages): Messages {
  const result: Messages = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const current = result[key];
    result[key] =
      typeof value === "object" && typeof current === "object" ? merge(current, value) : value;
  }
  return result;
}

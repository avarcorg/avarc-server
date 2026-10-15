import { defineRouting } from "next-intl/routing";

// The language is the first segment of the path. A further language is a
// further entry here and a file in messages/.
export const routing = defineRouting({
  locales: ["en", "de"],
  defaultLocale: "en",
});

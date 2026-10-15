import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Sends a path without a language to the language of the browser. The API
// (served by the backend), Next's own files and files with an extension are
// left alone.
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|.*\\..*).*)",
};

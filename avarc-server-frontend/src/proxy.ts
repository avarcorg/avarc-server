import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// The announced address of the application index; it leads to the page in the
// language of the browser.
const APPLICATIONS = "/.well-known/applications";

// Sends a path without a language to the language of the browser. The API
// (served by the backend), Next's own files and files with an extension are
// left alone.
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === APPLICATIONS) {
    const url = request.nextUrl.clone();
    url.pathname = "/applications";
    return intl(new NextRequest(url, request));
  }
  return intl(request);
}

export const config = {
  matcher: ["/.well-known/applications", "/((?!api|_next|.*\\..*).*)"],
};

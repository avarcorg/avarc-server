import logger from './utils/edge-logger';
import { NextResponse } from 'next/server';

export function middleware(request) {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    // To debug headers, uncomment the following line:
    // headers: Object.fromEntries(request.headers)
  });

  // Continue with the request
  const response = NextResponse.next();

  // Calculate response time
  const responseTime = Date.now() - start;

  // Log response
  logger.access(request, response, responseTime);

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

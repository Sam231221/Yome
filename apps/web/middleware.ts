// Ref: https://next-auth.js.org/configuration/nextjs#advanced-usage
//
// SECURITY NOTE — the `visual-qa=1` auth bypass below.
// It lets local visual-regression tooling render protected pages without a
// session. It is guarded by THREE conditions that must ALL hold:
//   1. NODE_ENV !== "production"
//   2. request host is exactly "localhost" or "127.0.0.1"
//   3. the request carries `?visual-qa=1`
// Condition (2) is the real boundary: a deployed instance served on any real
// hostname can never satisfy it, so the bypass is unreachable in production
// regardless of how NODE_ENV is set. Do not relax the host check.
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(request: NextRequestWithAuth) {
    const isDev = process.env.NODE_ENV !== "production";
    const isLocalhost =
      request.nextUrl.hostname === "127.0.0.1" ||
      request.nextUrl.hostname === "localhost";
    const isVisualQa = request.nextUrl.searchParams.get("visual-qa") === "1";

    if (isDev && isLocalhost && isVisualQa) {
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const isDev = process.env.NODE_ENV !== "production";
        const isLocalhost =
          req.nextUrl.hostname === "127.0.0.1" ||
          req.nextUrl.hostname === "localhost";
        const isVisualQa = req.nextUrl.searchParams.get("visual-qa") === "1";

        if (isDev && isLocalhost && isVisualQa) {
          return true;
        }

        return !!token;
      },
    },
  },
);

// Applies next-auth only to matching routes - can be regex
// Ref: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    "/dashboard",
    "/account",
    "/chat",
    "/chat/:path*",
    "/userfeeds",
    "/onboarding",
    "/explore",
    "/groups/:path*",
    "/connections",
    "/study-rooms",
    "/resources/:path*",
    "/projects/:path*",
    "/events",
    "/notifications",
    "/settings",
  ],
};

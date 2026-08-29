// Ref: https://next-auth.js.org/configuration/nextjs#advanced-usage
import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(request: NextRequestWithAuth) {
    const isDev = process.env.NODE_ENV !== "production";
    const isLocalhost =
      request.nextUrl.hostname === "127.0.0.1" || request.nextUrl.hostname === "localhost";
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
          req.nextUrl.hostname === "127.0.0.1" || req.nextUrl.hostname === "localhost";
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

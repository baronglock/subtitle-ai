import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Allow access to public pages
        const publicPaths = ["/", "/login", "/signup", "/pricing"];
        const pathname = req.nextUrl.pathname;
        
        if (publicPaths.includes(pathname)) {
          return true;
        }
        
        // Require authentication for protected pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transcribe/:path*",
    "/api/transcribe/:path*",
    "/api/translate/:path*",
  ],
};
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import * as jose from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Paths that don't require authentication
  const publicPaths = ["/login"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (request.nextUrl.pathname === "/login") {
    // Always allow access to login page, but clear expired tokens
    const response = NextResponse.next();

    // Try to verify the tokens, if they fail verification, clear them
    if (token) {
      try {
        await jose.jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET)
        );
      } catch (error) {
        response.cookies.delete("token");
      }
    }

    if (refreshToken) {
      try {
        await jose.jwtVerify(
          refreshToken,
          new TextEncoder().encode(process.env.JWT_SECRET)
        );
      } catch (error) {
        response.cookies.delete("refreshToken");
      }
    }

    return response;
  }

  // Special path for token refresh
  const isRefreshPath = request.nextUrl.pathname === "/api/refresh";

  // Allow refresh API calls to pass through
  if (isRefreshPath) {
    return NextResponse.next();
  }

  if (!token && !isPublicPath) {
    // If no access token but has refresh token, redirect to refresh endpoint
    if (refreshToken) {
      const response = NextResponse.redirect(
        new URL("/api/refresh", request.url)
      );
      return response;
    }
    // No tokens at all, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicPath) {
    // Redirect to home if trying to access login page with valid token
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && !isPublicPath) {
    try {
      // Verify JWT token
      await jose.jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      return NextResponse.next();
    } catch (error) {
      // Token verification failed - could be expired
      console.error("Token verification failed:", error);

      // If we have a refresh token, try to use it
      if (refreshToken) {
        // Redirect to the refresh endpoint
        const response = NextResponse.redirect(
          new URL("/api/refresh", request.url)
        );

        // Store the original URL to redirect back after refresh
        response.cookies.set("originalPath", request.nextUrl.pathname);
        return response;
      }

      // No refresh token or invalid, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get the refresh token from cookies
    const refreshToken = cookies().get("refreshToken")?.value;

    // Get the original path the user was trying to access
    const originalPath = cookies().get("originalPath")?.value || "/";

    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verify the refresh token
    try {
      const { payload } = await jose.jwtVerify(
        refreshToken,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );

      // Check if it's actually a refresh token
      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const userId =
        typeof payload.userId === "number"
          ? payload.userId
          : typeof payload.userId === "string"
            ? Number(payload.userId)
            : NaN;

      if (!Number.isFinite(userId)) {
        throw new Error("Invalid user id");
      }

      const dbUser = await prisma.hps_login.findUnique({
        where: { he_user_id: userId },
        select: {
          he_user_id: true,
          he_username: true,
          user_level: true,
        },
      });

      if (!dbUser) {
        throw new Error("User not found");
      }

      // Create a new access token with fresh role from DB
      const newAccessToken = await new jose.SignJWT({
        userId: dbUser.he_user_id,
        username: dbUser.he_username,
        userLevel: dbUser.user_level,
        type: "access",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      // Create a response that redirects to the original path
      const response = NextResponse.redirect(new URL(originalPath, request.url));

      // Set the new access token cookie on the response
      response.cookies.set({
        name: "token",
        value: newAccessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      // Clear the originalPath cookie since we've used it
      response.cookies.set({
        name: "originalPath",
        value: "",
        maxAge: 0,
        path: "/",
      });

      return response;
    } catch (error) {
      console.error("Token verification failed:", error);

      // Redirect to login on verification failure
      const response = NextResponse.redirect(new URL("/login", request.url));

      // Clear both tokens on verification failure
      response.cookies.delete("token");
      response.cookies.delete("refreshToken");
      response.cookies.delete("originalPath");

      return response;
    }
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

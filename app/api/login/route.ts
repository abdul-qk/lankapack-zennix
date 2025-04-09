import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import * as jose from "jose";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Hash the password using MD5
    const hashedPassword = crypto
      .createHash("md5")
      .update(password)
      .digest("hex");

    // Find user in database
    const user = await prisma.hps_login.findFirst({
      where: {
        he_username: username,
        he_password: hashedPassword,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create access token (short-lived, e.g., 15 minutes)
    const accessToken = await new jose.SignJWT({
      userId: user.he_user_id,
      username: user.he_username,
      type: "access"
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Create refresh token (longer-lived, e.g., 7 days)
    const refreshToken = await new jose.SignJWT({
      userId: user.he_user_id,
      username: user.he_username,
      type: "refresh"
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Set cookies
    cookies().set({
      name: "token",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    cookies().set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.he_user_id,
        username: user.he_username,
        email: user.he_email,
        fullName: user.he_full_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";
import { USER_LEVELS } from "@/lib/auth-constants";

export { USER_LEVELS };
export type { UserLevel } from "@/lib/auth-constants";

export type SessionUser = {
  userId: number;
  username: string;
  userLevel: string;
};

type AuthFailure = { ok: false; response: NextResponse };
type AuthSuccess = { ok: true; user: SessionUser };
export type AuthResult = AuthSuccess | AuthFailure;

function parseUserId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Reads the httpOnly access JWT cookie and returns the logged-in session user.
 * Returns null when the token is missing, expired, invalid, or not an access token.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get("token")?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    if (payload.type !== "access") {
      return null;
    }

    const userId = parseUserId(payload.userId);
    const username =
      typeof payload.username === "string" ? payload.username : null;

    if (userId === null || !username) {
      return null;
    }

    let userLevel =
      typeof payload.userLevel === "string" ? payload.userLevel : null;

    // Older tokens minted before roles may omit userLevel — load from DB.
    if (!userLevel) {
      const dbUser = await prisma.hps_login.findUnique({
        where: { he_user_id: userId },
        select: { user_level: true },
      });
      userLevel = dbUser?.user_level ?? null;
    }

    if (!userLevel) {
      return null;
    }

    return { userId, username, userLevel };
  } catch {
    return null;
  }
}

/**
 * Reads the httpOnly access JWT cookie and returns the logged-in user id.
 * Returns null when the token is missing, expired, invalid, or not an access token.
 */
export async function getSessionUserId(): Promise<number | null> {
  const user = await getSessionUser();
  return user?.userId ?? null;
}

export async function requireSession(): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

export async function requireAdmin(): Promise<AuthResult> {
  const session = await requireSession();
  if (!session.ok) {
    return session;
  }

  if (session.user.userLevel !== USER_LEVELS.ADMIN) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return session;
}

import { cookies } from "next/headers";
import * as jose from "jose";

/**
 * Reads the httpOnly access JWT cookie and returns the logged-in user id.
 * Returns null when the token is missing, expired, invalid, or not an access token.
 */
export async function getSessionUserId(): Promise<number | null> {
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

    const userId = payload.userId;
    if (typeof userId === "number" && Number.isFinite(userId)) {
      return userId;
    }
    if (typeof userId === "string" && userId.trim() !== "") {
      const parsed = Number(userId);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  } catch {
    return null;
  }
}

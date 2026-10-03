import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.hps_login.findUnique({
      where: { he_user_id: session.userId },
      select: {
        he_user_id: true,
        he_username: true,
        he_full_name: true,
        he_email: true,
        user_level: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.he_user_id,
      username: user.he_username,
      fullName: user.he_full_name,
      email: user.he_email,
      userLevel: user.user_level,
    });
  } catch (error) {
    console.error("Me route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

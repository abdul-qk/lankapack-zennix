import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const jobCardId = parseInt(params.id);

    const updatedJobCard = await prisma.hps_jobcard.update({
      where: {
        job_card_id: jobCardId,
      },
      data: {
        card_cutting: 0,
      },
    });

    return NextResponse.json({
      message: "Cutting process reopened",
      data: updatedJobCard,
    });
  } catch (error) {
    console.error("Error reopening cutting status:", error);
    return NextResponse.json(
      { error: "Failed to reopen cutting status" },
      { status: 500 }
    );
  }
}

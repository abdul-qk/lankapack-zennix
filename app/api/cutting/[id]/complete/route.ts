import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);

    // Update the job card's cutting status
    const updatedJobCard = await prisma.hps_jobcard.update({
      where: {
        job_card_id: jobCardId,
      },
      data: {
        card_cutting: 1,
      },
    });

    return NextResponse.json({
      message: "Cutting process marked as completed",
      data: updatedJobCard,
    });
  } catch (error) {
    console.error("Error updating cutting status:", error);
    return NextResponse.json(
      { error: "Failed to update cutting status" },
      { status: 500 }
    );
  }
}

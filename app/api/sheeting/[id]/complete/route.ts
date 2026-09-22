import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);

    // Update the job card's sheeting status
    const updatedJobCard = await prisma.hps_jobcard.update({
      where: {
        job_card_id: jobCardId,
      },
      data: {
        card_sheeting: 1,
      },
    });

    return NextResponse.json({
      message: "Sheeting process marked as completed",
      data: updatedJobCard,
    });
  } catch (error) {
    console.error("Error updating sheeting status:", error);
    return NextResponse.json(
      { error: "Failed to update sheeting status" },
      { status: 500 }
    );
  }
}

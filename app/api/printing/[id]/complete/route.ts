import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);

    // Update the job card's printing status
    const updatedJobCard = await prisma.hps_jobcard.update({
      where: {
        job_card_id: jobCardId,
      },
      data: {
        card_printting: 1,
      },
    });

    return NextResponse.json({
      message: "Printing process marked as completed",
      data: updatedJobCard,
    });
  } catch (error) {
    console.error("Error updating printing status:", error);
    return NextResponse.json(
      { error: "Failed to update printing status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

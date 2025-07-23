import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const jobCardId = parseInt(params.id);

        // Update the job card's slitting status
        const updatedJobCard = await prisma.hps_jobcard.update({
            where: {
                job_card_id: jobCardId,
            },
            data: {
                card_slitting: 1,
            },
        });

        return NextResponse.json({ message: "Slitting process marked as completed", data: updatedJobCard });
    } catch (error) {
        console.error("Error updating slitting status:", error);
        return NextResponse.json(
            { error: "Failed to update slitting status" },
            { status: 500 }
        );
  }
}
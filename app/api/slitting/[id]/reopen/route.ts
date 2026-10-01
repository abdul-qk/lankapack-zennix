import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const jobCardId = parseInt(params.id);

        const updatedJobCard = await prisma.hps_jobcard.update({
            where: {
                job_card_id: jobCardId,
            },
            data: {
                card_slitting: 0,
            },
        });

        return NextResponse.json({
            message: "Slitting process reopened",
            data: updatedJobCard,
        });
    } catch (error) {
        console.error("Error reopening slitting status:", error);
        return NextResponse.json(
            { error: "Failed to reopen slitting status" },
            { status: 500 }
        );
    }
}

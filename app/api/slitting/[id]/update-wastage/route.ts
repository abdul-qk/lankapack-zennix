import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { slitting_id, wastage, wastage_width } = await req.json();

    // Validate inputs
    if (!slitting_id) {
      return Response.json(
        { error: "Slitting ID is required" },
        { status: 400 }
      );
    }

    if (!wastage) {
      return Response.json(
        { error: "Wastage weight is required" },
        { status: 400 }
      );
    }

    if (!wastage_width) {
      return Response.json(
        { error: "Wastage width is required" },
        { status: 400 }
      );
    }

    // Update the slitting record with wastage information
    const updatedSlitting = await prisma.hps_slitting.update({
      where: {
        slitting_id: parseInt(slitting_id),
      },
      data: {
        wastage: wastage.toString(),
        wastage_width: wastage_width.toString(),
        update_date: new Date(),
      },
    });

    // Also update the corresponding wastage record in hps_slitting_wastage
    const wastageRecord = await prisma.hps_slitting_wastage.findFirst({
      where: {
        slitting_id: parseInt(slitting_id),
        job_card_id: jobCardId,
      },
    });

    if (wastageRecord) {
      await prisma.hps_slitting_wastage.update({
        where: {
          slitting_wastage_id: wastageRecord.slitting_wastage_id,
        },
        data: {
          slitting_wastage: wastage.toString(),
          add_date: new Date(),
        },
      });
    }

    return Response.json(
      {
        success: true,
        message: "Wastage information updated successfully",
        data: updatedSlitting,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating wastage information:", error);

    return Response.json(
      {
        error: "Failed to update wastage information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

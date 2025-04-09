import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { roll_id } = await req.json();

    // Validate input
    if (!roll_id) {
      return Response.json({ error: "Roll ID is required" }, { status: 400 });
    }

    // Find the roll to get the slitting_id before deleting
    const rollRecord = await prisma.hps_slitting_roll.findUnique({
      where: {
        roll_id: parseInt(roll_id),
      },
      select: {
        slitting_id: true,
      },
    });

    if (!rollRecord) {
      return Response.json({ error: "Roll not found" }, { status: 404 });
    }

    // Save the slitting_id for later use
    const slittingId = rollRecord.slitting_id;

    // Delete the roll
    await prisma.hps_slitting_roll.delete({
      where: {
        roll_id: parseInt(roll_id),
      },
    });

    // Update the number_of_roll count in the slitting record
    const slittingRecord = await prisma.hps_slitting.findUnique({
      where: {
        slitting_id: slittingId,
      },
    });

    if (slittingRecord && slittingRecord.number_of_roll > 0) {
      await prisma.hps_slitting.update({
        where: {
          slitting_id: slittingId,
        },
        data: {
          number_of_roll: slittingRecord.number_of_roll - 1,
        },
      });
    }

    return Response.json(
      {
        success: true,
        message: "Slitting roll deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting slitting roll:", error);

    return Response.json(
      {
        error: "Failed to delete slitting roll",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

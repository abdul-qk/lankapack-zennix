import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id); // jobCardId is available but not explicitly used in the core logic below, consider if it's needed for hps_stock deletion or other parts.
    const { roll_id, barcode } = await req.json();

    // Validate input
    if (!roll_id) {
      return Response.json({ error: "Roll ID is required" }, { status: 400 });
    }
    if (!barcode) {
      return Response.json({ error: "Barcode is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find the roll to get the slitting_id before deleting
      const rollRecord = await tx.hps_slitting_roll.findUnique({
        where: {
          roll_id: parseInt(roll_id),
        },
        select: {
          slitting_id: true,
        },
      });

      if (!rollRecord) {
        throw new Error("Roll not found"); // This will be caught by the transaction and rolled back
      }

      const slittingId = rollRecord.slitting_id;

      // Delete the roll from hps_slitting_roll
      await tx.hps_slitting_roll.delete({
        where: {
          roll_id: parseInt(roll_id),
        },
      });

      // Update the number_of_roll count in the hps_slitting record
      const slittingRecord = await tx.hps_slitting.findUnique({
        where: {
          slitting_id: slittingId,
        },
      });

      if (slittingRecord && slittingRecord.number_of_roll > 0) {
        await tx.hps_slitting.update({
          where: {
            slitting_id: slittingId,
          },
          data: {
            number_of_roll: slittingRecord.number_of_roll - 1,
          },
        });
      }

      // Delete the entry from hps_stock using the barcode
      // Assuming barcode in hps_stock is of type BigInt, similar to other routes
      const barcodeBigInt = BigInt(barcode);
      const stockDeletionResult = await tx.hps_stock.deleteMany({
        where: {
          stock_barcode: barcodeBigInt,
          // Potentially add job_card_id: jobCardId if relevant for hps_stock context
        },
      });

      return {
        slittingRollDeleted: true,
        slittingRecordUpdated: slittingRecord && slittingRecord.number_of_roll > 0,
        stockEntriesDeleted: stockDeletionResult.count,
      };
    });

    return Response.json(
      {
        success: true,
        message: "Slitting roll and corresponding stock entry deleted successfully",
        details: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting slitting roll:", error);
    let errorMessage = "Failed to delete slitting roll";
    let statusCode = 500;

    if (error instanceof Error && error.message === "Roll not found") {
      errorMessage = "Roll not found";
      statusCode = 404;
    }

    return Response.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}

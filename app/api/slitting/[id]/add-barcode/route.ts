import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { roll_barcode_no } = await req.json();

    // Validate input
    if (!roll_barcode_no) {
      return Response.json({ error: "Barcode is required" }, { status: 400 });
    }

    // Convert barcode to BigInt if necessary (since it's BigInt in the schema)
    const barcodeBigInt = BigInt(roll_barcode_no);

    // Check if the barcode exists in stock
    const stockItem = await prisma.hps_stock.findFirst({
      where: {
        stock_barcode: barcodeBigInt,
        // material_status: 1, // Assuming 1 means available/active
      },
    });

    if (!stockItem) {
      return Response.json(
        { error: "Barcode not found in stock or unavailable" },
        { status: 404 }
      );
    }

    // Extract weight information
    const rollWeight = stockItem.item_net_weight;
    const rollSize = stockItem.material_item_size;
    const rollGSM = stockItem.item_gsm;

    // Create a new slitting entry
    const newSlitting = await prisma.hps_slitting.create({
      data: {
        job_card_id: jobCardId,
        roll_barcode_no: roll_barcode_no.toString(), // Convert to string as per schema
        number_of_roll: 0, // Initial value, will be updated as rolls are added
        wastage: "0", // Initial value
        wastage_width: "0", // Initial value
        added_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 0, // Not deleted
      },
    });

    // Create corresponding wastage record
    await prisma.hps_slitting_wastage.create({
      data: {
        job_card_id: jobCardId,
        slitting_id: newSlitting.slitting_id, // Use the ID from the newly created slitting record
        slitting_wastage: "0", // Initial wastage value
        add_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 0, // Not deleted
      },
    });

    return Response.json(
      {
        success: true,
        message: "Barcode added successfully",
        data: newSlitting,
        stockDetails: {
          weight: rollWeight,
          size: rollSize,
          gsm: rollGSM,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding barcode to slitting:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (
        error.message.includes("invalid input syntax") ||
        error.message.includes("Cannot parse")
      ) {
        return Response.json(
          { error: "Invalid barcode format" },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        error: "Failed to add barcode",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { slitting_id } = await req.json();

    // Validate input
    if (!slitting_id) {
      return Response.json(
        { error: "Slitting ID is required" },
        { status: 400 }
      );
    }

    // Find the slitting record to get the barcode
    const slittingRecord = await prisma.hps_slitting.findUnique({
      where: {
        slitting_id: parseInt(slitting_id),
      },
    });

    if (!slittingRecord) {
      return Response.json(
        { error: "Slitting record not found" },
        { status: 404 }
      );
    }

    // Begin transaction to ensure all deletions happen or none happen
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete associated slitting_wastage records
      await tx.hps_slitting_wastage.deleteMany({
        where: {
          slitting_id: parseInt(slitting_id),
          job_card_id: jobCardId,
        },
      });

      // 2. Delete any slitting_roll records if they exist
      await tx.hps_slitting_roll.deleteMany({
        where: {
          slitting_id: parseInt(slitting_id),
          job_card_id: jobCardId,
        },
      });

      // 3. Delete the slitting record itself
      await tx.hps_slitting.delete({
        where: {
          slitting_id: parseInt(slitting_id),
        },
      });

      // 4. Find and update the stock record back to available status
      // Convert barcode to BigInt for searching
      const barcodeBigInt = BigInt(slittingRecord.roll_barcode_no);

      const stockRecord = await tx.hps_stock.findFirst({
        where: {
          stock_barcode: barcodeBigInt,
        },
      });

      if (stockRecord) {
        await tx.hps_stock.update({
          where: {
            stock_id: stockRecord.stock_id,
          },
          data: {
            material_status: 1, // Back to available status
          },
        });
      }

      return { success: true, barcode: slittingRecord.roll_barcode_no };
    });

    return Response.json(
      {
        success: true,
        message: "Slitting record and related data deleted successfully",
        barcode: result.barcode,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting slitting record:", error);

    return Response.json(
      {
        error: "Failed to delete slitting record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

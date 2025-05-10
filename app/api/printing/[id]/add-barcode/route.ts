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

    // Check if the barcode exists in stock and get item_net_weight
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

    // Create a new printing entry
    const newSlitting = await prisma.hps_print.create({
      data: {
        job_card_id: jobCardId,
        print_barcode_no: roll_barcode_no.toString(), // Convert to string as per schema
        number_of_bag: 0, // Initial value, will be updated as rolls are added
        balance_weight: "0", // Initial value
        balance_width: "0", // Initial value
        print_wastage: "0", // Initial value
        added_date: new Date(),
        update_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 2, // Not deleted
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
    console.error("Error adding barcode to printing:", error);

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
    const { print_id } = await req.json();

    // Validate input
    if (!print_id) {
      return Response.json({ error: "Print ID is required" }, { status: 400 });
    }

    // Check if the print record exists
    const printRecord = await prisma.hps_print.findFirst({
      where: {
        print_id: print_id,
        job_card_id: jobCardId,
      },
    });

    if (!printRecord) {
      return Response.json(
        { error: "Print record not found" },
        { status: 404 }
      );
    }

    // Delete associated printing packs first to maintain referential integrity
    await prisma.hps_print_pack.deleteMany({
      where: {
        print_id: print_id,
        job_card_id: jobCardId,
      },
    });

    // Delete associated print wastage records
    await prisma.hps_print_wastage.deleteMany({
      where: {
        print_id: print_id,
        job_card_id: jobCardId,
      },
    });

    // Now delete the print record
    await prisma.hps_print.delete({
      where: {
        print_id: print_id,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Print record deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting print record:", error);

    return Response.json(
      {
        error: "Failed to delete print record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

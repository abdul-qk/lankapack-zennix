import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { print_id, print_pack_weight, selectedBarcode } = await req.json();

    // Validate input
    if (!print_id) {
      return Response.json({ error: "Print ID is required" }, { status: 400 });
    }

    if (print_pack_weight == undefined || print_pack_weight === null) {
      return Response.json(
        { error: "Print pack weight is required" },
        { status: 400 }
      );
    }

    if (!selectedBarcode) {
      return Response.json(
        { error: "Selected barcode is required" },
        { status: 400 }
      );
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

    // Find the source stock record
    const sourceStock = await prisma.hps_stock.findFirst({
      where: {
        stock_barcode: BigInt(selectedBarcode),
      },
    });

    if (!sourceStock) {
      return Response.json(
        { error: "Source stock record not found" },
        { status: 404 }
      );
    }

    // Generate a unique barcode for the print pack in the format {ddmmyyyyhhmmss}
    // First create the print pack record to get the pack_id
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // January is 0
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const formattedTimestamp = `${day}${month}${year}${hours}${minutes}${seconds}`;

    // Create the print pack record first to get the pack_id
    const newPrintPack = await prisma.hps_print_pack.create({
      data: {
        job_card_id: jobCardId,
        print_id: print_id,
        print_pack_weight: print_pack_weight.toString(),
        print_barcode: formattedTimestamp, // Temporary barcode, will update
        add_date: now,
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 0, // Not deleted
      },
    });

    // Now update the barcode with the pack_id included
    const printPackBarcode = `${newPrintPack.pack_id}${formattedTimestamp}`;

    // Update the record with the final barcode
    const updatedPrintPack = await prisma.hps_print_pack.update({
      where: {
        pack_id: newPrintPack.pack_id,
      },
      data: {
        print_barcode: printPackBarcode,
      },
    });

    // Create a new stock record
    const newStock = await prisma.hps_stock.create({
      data: {
        material_item_particular: sourceStock.material_item_particular,
        material_used_buy: 3,
        main_id: sourceStock.main_id,
        material_item_id: sourceStock.material_item_id,
        item_gsm: sourceStock.item_gsm,
        stock_barcode: BigInt(printPackBarcode),
        material_item_size: sourceStock.material_item_size,
        item_net_weight: print_pack_weight.toString(),
        stock_date: new Date(),
        material_status: 1
      },
    });

    return Response.json(
      {
        success: true,
        message: "Print pack added successfully",
        data: updatedPrintPack,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding print pack:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (
        error.message.includes("invalid input syntax") ||
        error.message.includes("Cannot parse")
      ) {
        return Response.json(
          { error: "Invalid input format" },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        error: "Failed to add print pack",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

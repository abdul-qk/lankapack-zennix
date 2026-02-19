import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { slitting_id, slitting_roll_weight, slitting_roll_width, selectedBarcode } =
      await req.json();

    // Get stock data using selectedBarcode to fetch material information
    if (!selectedBarcode) {
      return Response.json(
        { error: "Selected barcode is required" },
        { status: 400 }
      );
    }

    const stockData = await prisma.hps_stock.findFirst({
      where: { 
        stock_barcode: BigInt(selectedBarcode),
      }
    });

    if (!stockData) {
      return Response.json(
        { error: "Stock record not found for the selected barcode" },
        { status: 404 }
      );
    }

    // Validate inputs
    if (!slitting_id) {
      return Response.json(
        { error: "Slitting ID is required" },
        { status: 400 }
      );
    }

    if (!slitting_roll_weight) {
      return Response.json(
        { error: "Roll weight is required" },
        { status: 400 }
      );
    }

    if (!slitting_roll_width) {
      return Response.json(
        { error: "Roll width is required" },
        { status: 400 }
      );
    }

    // We need to get the next ID for the barcode
    // Since we can't directly get the next ID in Prisma, we'll get the highest ID and add 1
    const highestRollRecord = await prisma.hps_slitting_roll.findFirst({
      orderBy: {
        roll_id: "desc",
      },
      select: {
        roll_id: true,
      },
    });
    const nextId = (highestRollRecord?.roll_id || 0) + 1;

    // Format date as dd-mm-yyhh:mm:ss
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const formattedDate = `${day}-${month}-${year}${hours}:${minutes}:${seconds}`;
    // Remove non-numeric characters
    const numericDate = formattedDate.replace(/[^0-9]/g, "");
    // Create barcode by concatenating nextId and numericDate
    const slittingBarcode = `${nextId}${numericDate}`;

    // Create a new slitting roll record
    const newSlittingRoll = await prisma.hps_slitting_roll.create({
      data: {
        job_card_id: jobCardId,
        slitting_id: parseInt(slitting_id),
        slitting_roll_weight: slitting_roll_weight.toString(),
        slitting_roll_width: slitting_roll_width.toString(),
        slitting_barcode: slittingBarcode,
        add_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 0,
      },
    });

    // Create a stock record for the slitting roll
    await prisma.hps_stock.create({
      data: {
        material_item_particular: stockData.material_item_particular,
        stock_barcode: BigInt(slittingBarcode),
        main_id: stockData.main_id,
        material_item_id: stockData.material_item_id,
        item_net_weight: slitting_roll_weight.toString(),
        item_gsm: stockData.item_gsm,
        material_item_size: slitting_roll_width.toString(),
        material_used_buy: 2,
        material_status: 1,
        stock_date: new Date(),
      },
    });

    // Update the number_of_roll count in the slitting record
    const slittingRecord = await prisma.hps_slitting.findUnique({
      where: {
        slitting_id: parseInt(slitting_id),
      },
    });

    if (slittingRecord) {
      await prisma.hps_slitting.update({
        where: {
          slitting_id: parseInt(slitting_id),
        },
        data: {
          number_of_roll: (slittingRecord.number_of_roll || 0) + 1,
        },
      });
    }

    return Response.json(
      {
        success: true,
        message: "Slitting roll added successfully",
        data: newSlittingRoll,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding slitting roll:", error);

    return Response.json(
      { error: "Failed to add slitting roll" },
      { status: 500 }
    );
  }
}

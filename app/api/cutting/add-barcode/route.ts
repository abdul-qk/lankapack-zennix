// /app/api/cutting/add-barcode/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { jobCardId, barcode, weight, userId } = await request.json();

    // Validate inputs
    if (!jobCardId || !barcode || !weight || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the barcode exists in the hps_stock table
    const stockItem = await prisma.hps_stock.findFirst({
      where: {
        stock_barcode: BigInt(barcode),
      },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: "Barcode not found in stock or not available" },
        { status: 404 }
      );
    }

    // Create new cutting record
    const newCutting = await prisma.hps_cutting.create({
      data: {
        job_card_id: jobCardId,
        roll_barcode_no: barcode,
        cutting_weight: weight,
        number_of_roll: 1, // Default value, adjust as needed
        wastage: "0", // Default value, adjust as needed
        added_date: new Date(),
        user_id: userId,
        del_ind: 0,
      },
    });

    // Update the stock status to indicate it has been used (status = 1)
    await prisma.hps_stock.update({
      where: {
        stock_id: stockItem.stock_id,
      },
      data: {
        material_status: 1, // Set status to 1 indicating the roll has been used
        material_used_buy: 4,
      },
    });

    return NextResponse.json(
      { success: true, data: newCutting },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding barcode:", error);
    return NextResponse.json(
      { error: "Failed to add barcode", details: error.message },
      { status: 500 }
    );
  }
}

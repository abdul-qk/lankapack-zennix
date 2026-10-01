// /app/api/sheeting/delete-barcode/[sheetingId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Input sheetingId:", params.id);
    const sheetingId = parseInt(params.id);
    console.log("Received sheetingId:", sheetingId);

    if (isNaN(sheetingId)) {
      return NextResponse.json(
        { error: "Invalid sheeting ID" },
        { status: 400 }
      );
    }

    const barcode = await prisma.hps_sheeting.findFirst({
      where: { sheeting_id: sheetingId },
      select: { roll_barcode_no: true },
    });

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode not found in sheeting table" },
        { status: 404 }
      );
    }

    const stockItem = await prisma.hps_stock.findFirst({
      where: {
        stock_barcode: Number(barcode.roll_barcode_no),
      },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: "Barcode not found in stock or not available" },
        { status: 404 }
      );
    }

    await prisma.hps_stock.update({
      where: {
        stock_id: stockItem.stock_id,
      },
      data: {
        material_status: 0, // Set status to 1 indicating the roll has been used
        material_used_buy: 1,
      },
    });

    // Hard delete the sheeting record
    await prisma.hps_sheeting.delete({
      where: { sheeting_id: sheetingId },
    });

    return NextResponse.json(
      { success: true, message: "Barcode deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting barcode:", error);
    return NextResponse.json(
      { error: "Failed to delete barcode" },
      { status: 500 }
    );
  }
}

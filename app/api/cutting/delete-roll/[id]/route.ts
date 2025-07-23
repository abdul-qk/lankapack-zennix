// /app/api/cutting/delete-barcode/[cuttingId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cuttingId = parseInt(params.id);

    if (isNaN(cuttingId)) {
      return NextResponse.json(
        { error: "Invalid cutting ID" },
        { status: 400 }
      );
    }

    // Hard delete the cutting record
    await prisma.hps_cutting_roll.delete({
      where: { cutting_roll_id: cuttingId },
    });

    return NextResponse.json(
      { success: true, message: "Barcode deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting barcode:", error);
    return NextResponse.json(
      { error: "Failed to delete barcode", details: error },
      { status: 500 }
    );
  }
}

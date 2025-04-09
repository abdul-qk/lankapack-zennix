// /app/api/cutting/delete-barcode/[cuttingId]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { cuttingId: string } }
) {
  try {
    const cuttingId = parseInt(params.cuttingId);

    if (isNaN(cuttingId)) {
      return NextResponse.json(
        { error: "Invalid cutting ID" },
        { status: 400 }
      );
    }

    // Hard delete the cutting record
    await prisma.hps_cutting.delete({
      where: { cutting_id: cuttingId },
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

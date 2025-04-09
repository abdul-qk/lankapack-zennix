import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all barcodes from cutting_roll table
    const barcodes = await prisma.hps_cutting_roll.findMany({
      where: {
        cutting_barcode: {
          not: null,
        },
      },
      select: {
        cutting_roll_id: true,
        cutting_barcode: true,
      },
      orderBy: {
        cutting_roll_id: "desc",
      },
    });

    // Filter out any null values that might slip through
    const validBarcodes = barcodes.filter((item) => item.cutting_barcode);

    return NextResponse.json({
      message: "Barcodes fetched successfully",
      barcodes: validBarcodes,
    });
  } catch (error) {
    console.error("Error fetching barcodes:", error);
    return NextResponse.json(
      { message: "Error fetching barcodes", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

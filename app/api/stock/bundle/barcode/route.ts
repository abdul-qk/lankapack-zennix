import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // First, get total count
    const totalCount = await prisma.hps_cutting_roll.count({
      where: {
        cutting_barcode: {
          not: null,
        },
      },
    });

    console.log(`Total records with non-null barcodes: ${totalCount}`);

    // Fetch all barcodes from cutting_roll table with detailed logging
    const barcodes = await prisma.hps_cutting_roll.findMany({
      select: {
        cutting_roll_id: true,
        cutting_barcode: true,
      },
      orderBy: {
        cutting_roll_id: "desc",
      },
    });

    console.log(`Records fetched: ${barcodes.length}`);

    // Log the last few records for debugging
    if (barcodes.length > 0) {
      console.log("Last 5 records:", barcodes.slice(0, 5));
    }

    // Filter out any null values that might slip through
    const validBarcodes = barcodes.filter((item) => item.cutting_barcode);

    return NextResponse.json({
      message: "Barcodes fetched successfully",
      allBarcodes: totalCount,
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

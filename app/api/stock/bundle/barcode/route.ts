import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  console.log("Fetching barcodes...");
  try {
    // First, get total count
    const totalBarcodes = await prisma.hps_cutting_roll.findMany({});

    // console.log(`Total records with non-null barcodes: ${totalCount}`);

    // Fetch all barcodes from cutting_roll table with detailed logging
    const barcodes = await prisma.hps_cutting_roll.findMany({
      select: {
        cutting_roll_id: true,
        cutting_barcode: true,
      },
      where: {
        del_ind: 1,
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
      allBarcodes: totalBarcodes,
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

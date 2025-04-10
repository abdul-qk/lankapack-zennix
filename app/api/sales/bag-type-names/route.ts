import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all bag types from the database
    const bagTypes = await prisma.hps_bag_type.findMany({
      select: {
        bag_id: true,
        bag_type: true,
        bag_price: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: bagTypes,
    });
  } catch (error) {
    console.error("Error fetching bag type names:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bag type names" },
      { status: 500 }
    );
  }
}

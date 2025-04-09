import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid bundle ID" },
        { status: 400 }
      );
    }

    // Fetch bundle information with the related cutting roll
    const bundleData = await prisma.hps_bundle_info.findUnique({
      where: {
        bundle_info_id: id,
      },
      include: {
        cutting_roll: true,
      },
    });

    if (!bundleData) {
      return NextResponse.json(
        { message: "Bundle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Bundle information fetched successfully",
      data: bundleData,
    });
  } catch (error) {
    console.error("Error fetching bundle information:", error);
    return NextResponse.json(
      { message: "Error fetching bundle information", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// File: /app/api/stock/bundle/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = parseInt(params.id);

    if (isNaN(bundleId)) {
      return NextResponse.json({ error: "Invalid bundle ID" }, { status: 400 });
    }

    // Fetch the bundle info
    const bundle = await prisma.hps_bundle_info.findUnique({
      where: {
        bundle_info_id: bundleId,
      },
      include: {
        cutting_roll: true,
      }
    });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    return NextResponse.json({ bundle });
  } catch (error) {
    console.error("Error fetching bundle:", error);
    return NextResponse.json(
      { error: "Failed to fetch bundle" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cuttingRolls = await prisma.hps_cutting_roll.findMany({
      select: {
        cutting_roll_id: true,
        cutting_barcode: true,
      },
      orderBy: {
        cutting_id: "desc",
      },
    });

    const sheetingRolls = await prisma.hps_sheeting_roll.findMany({
      select: {
        sheeting_roll_id: true,
        sheeting_barcode: true,
      },
      orderBy: {
        sheeting_id: "desc",
      },
    });

    const barcodeInfo = [
      ...cuttingRolls
        .filter((r) => r.cutting_barcode)
        .map((r) => ({
          roll_id: r.cutting_roll_id,
          barcode: r.cutting_barcode as string,
          source: "cutting" as const,
          // Backward-compatible fields used by existing UI
          cutting_roll_id: r.cutting_roll_id,
          cutting_barcode: r.cutting_barcode as string,
        })),
      ...sheetingRolls
        .filter((r) => r.sheeting_barcode)
        .map((r) => ({
          roll_id: r.sheeting_roll_id,
          barcode: r.sheeting_barcode as string,
          source: "sheeting" as const,
          sheeting_roll_id: r.sheeting_roll_id,
          sheeting_barcode: r.sheeting_barcode as string,
          // So existing SelectItem keys still work via a shared barcode field
          cutting_roll_id: r.sheeting_roll_id,
          cutting_barcode: r.sheeting_barcode as string,
        })),
    ];

    return new Response(JSON.stringify({ data: barcodeInfo }), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching barcode info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

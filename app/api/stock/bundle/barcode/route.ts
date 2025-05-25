import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // const { searchParams } = new URL(req.url);
    // // const jobCardId = searchParams.get('job_card_id');

    // Fetch cutting roll data filtered by job_card_id
    const barcodeInfo = await prisma.hps_cutting_roll.findMany({
      select: {
        cutting_id: true,
        cutting_barcode: true,
      },
      orderBy: {
        cutting_id: "desc",
      },
    });

    return new Response(JSON.stringify({ data: barcodeInfo }), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching color info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

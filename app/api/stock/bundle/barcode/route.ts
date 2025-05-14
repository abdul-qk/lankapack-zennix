import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobCardId = searchParams.get('job_card_id');

    if (!jobCardId) {
      return new Response(JSON.stringify({ error: 'job_card_id is required' }), {
        status: 400,
      });
    }

    // Fetch cutting roll data filtered by job_card_id
    const colorInfo = await prisma.hps_cutting_roll.findMany({
      where: {
        job_card_id: parseInt(jobCardId, 10)
      }
    });

    return new Response(JSON.stringify({ data: colorInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching color info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

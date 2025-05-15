export const dynamic = 'force-dynamic';

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sizeFilter = searchParams.get("size");
    const statusFilter = searchParams.get("status");

    // Build the filter conditions
    const whereConditions: any = {};

    if (sizeFilter && sizeFilter !== "all") {
      whereConditions.bundle_type = sizeFilter;
    }

    if (statusFilter && statusFilter !== "all") {
      whereConditions.del_ind = statusFilter === "in" ? 1 : 0;
    }

    // Fetch data from both tables with filters
    const [completeItems, nonCompleteItems] = await Promise.all([
      prisma.hps_complete_item.findMany({
        where: whereConditions,
      }),
      prisma.hps_non_complete_item.findMany({
        where: whereConditions,
      }),
    ]);

    console.log(nonCompleteItems);

    return new Response(
      JSON.stringify({
        data: {
          complete_items: completeItems,
          non_complete_items: nonCompleteItems,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching items info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

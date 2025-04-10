export const dynamic = 'force-dynamic';

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return new Response(JSON.stringify({ error: "Barcode is required" }), {
        status: 400,
      });
    }

    // Check if barcode exists in complete_item table
    const completeItem = await prisma.hps_complete_item.findFirst({
      where: {
        complete_item_barcode: barcode,
        del_ind: 0,
      },
    });

    if (!completeItem) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Barcode not found in complete items" 
        }),
        { status: 404 }
      );
    }

    // Check if this item has already been returned
    const existingReturnItem = await prisma.hps_return_item.findFirst({
      where: {
        barcode_no: barcode,
        return_status: 0,
      },
    });

    if (existingReturnItem) {
      // If we found a return item, check if the associated return_info is active
      const returnInfo = await prisma.hps_return_info.findUnique({
        where: {
          return_info_id: existingReturnItem.return_info_id,
        },
      });

      if (returnInfo && returnInfo.del_ind === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "This item has already been returned" 
          }),
          { status: 400 }
        );
      }
    }

    // Get additional item details
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          complete_item_id: completeItem.complete_item_id,
          bundle_type: completeItem.bundle_type,
          weight: parseFloat(completeItem.complete_item_weight),
          bags: parseInt(completeItem.complete_item_bags),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating barcode:", error);
    return new Response(
      JSON.stringify({ error: "Failed to validate barcode" }),
      { status: 500 }
    );
  }
}

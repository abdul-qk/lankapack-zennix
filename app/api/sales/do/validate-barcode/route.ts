export const dynamic = 'force-dynamic';

import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return new Response(JSON.stringify({ success: false, error: "Barcode is required" }), {
        status: 400,
      });
    }

    // Check if barcode exists in complete_item table
    const completeItem = await prisma.hps_complete_item.findFirst({
      where: {
        complete_item_barcode: barcode,
        del_ind: 1,
      },
    });

    console.log(barcode); // Add this line for debugging

    if (!completeItem) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Barcode not found in complete items or already sold"
        }),
        { status: 404 }
      );
    }

    // Get price from the table hps_bag_type based on the bundle type
    const bagType = await prisma.hps_bag_type.findFirst({
      where: {
        bag_type: completeItem.bundle_type,
      },
    });

    if (!bagType) {
      return new Response(  
        JSON.stringify({
          success: false,
          error: "Bundle type not found"
        }),
        { status: 404 }
      );
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
          price: parseFloat(bagType.bag_price),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating barcode:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to validate barcode" }),
      { status: 500 }
    );
  }
}

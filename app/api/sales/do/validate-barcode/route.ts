export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import {
  pickBundlePrice,
  resolveItemKind,
} from "@/lib/sales/resolveBundlePrice";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode")?.trim();

    if (!barcode) {
      return new Response(
        JSON.stringify({ success: false, error: "Barcode is required" }),
        {
          status: 400,
        }
      );
    }

    // Check if barcode exists in complete_item table (in stock)
    const completeItem = await prisma.hps_complete_item.findFirst({
      where: {
        complete_item_barcode: barcode,
        del_ind: 1,
      },
    });

    if (!completeItem) {
      // Sheeting roll barcodes are used when building stock bundles, not on DO
      const sheetingRoll = await prisma.hps_sheeting_roll.findFirst({
        where: { sheeting_barcode: barcode },
        select: { sheeting_roll_id: true },
      });

      if (sheetingRoll) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "This is a sheeting roll barcode. Scan a stock bundle item barcode to add sheets to the DO.",
          }),
          { status: 404 }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Barcode not found in complete items or already sold",
        }),
        { status: 404 }
      );
    }

    // Price: bag types for cutting bundles, sheet types for sheeting bundles
    const [bagType, sheetType] = await Promise.all([
      prisma.hps_bag_type.findFirst({
        where: { bag_type: completeItem.bundle_type },
        select: { bag_price: true },
      }),
      prisma.hps_sheet_type.findFirst({
        where: { sheet_type: completeItem.bundle_type },
        select: { sheet_price: true },
      }),
    ]);

    const price = pickBundlePrice(bagType?.bag_price, sheetType?.sheet_price);
    const item_kind = resolveItemKind(!!bagType, !!sheetType);

    if (price === null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Bundle type not found",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          complete_item_id: completeItem.complete_item_id,
          bundle_type: completeItem.bundle_type,
          weight: parseFloat(completeItem.complete_item_weight),
          bags: parseInt(completeItem.complete_item_bags, 10),
          price,
          item_kind,
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

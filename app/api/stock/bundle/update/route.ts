// File: /app/api/stock/bundle/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const { bundleData, completeItemIds, nonCompleteItemIds } =
      await request.json();

    // Validate the bundle ID
    if (!bundleData.bundle_info_id || isNaN(bundleData.bundle_info_id)) {
      return NextResponse.json({ error: "Invalid bundle ID" }, { status: 400 });
    }

    // First update the bundle info
    const updatedBundle = await prisma.hps_bundle_info.update({
      where: {
        bundle_info_id: bundleData.bundle_info_id,
      },
      data: {
        bundle_barcode: bundleData.bundle_barcode,
        bundle_type: bundleData.bundle_type,
        bundle_info_weight: bundleData.bundle_info_weight,
        bundle_info_bags: bundleData.bundle_info_bags,
        bundle_info_average: bundleData.bundle_info_average,
        bundle_info_wastage_weight: bundleData.bundle_info_wastage_weight,
        bundle_info_wastage_bags: bundleData.bundle_info_wastage_bags,
        bundle_qty: bundleData.bundle_qty,
        bundle_slitt_wastage: bundleData.bundle_slitt_wastage,
        bundle_print_wastage: bundleData.bundle_print_wastage,
        bundle_cutting_wastage: bundleData.bundle_cutting_wastage,
        bundle_date: new Date(), // Update the date to current
        user_id: bundleData.user_id,
        bundle_info_status: bundleData.bundle_info_status,
      },
    });

    // Update all complete items to associate with this bundle
    if (completeItemIds && completeItemIds.length > 0) {
      await prisma.hps_complete_item.updateMany({
        where: {
          complete_item_id: {
            in: completeItemIds,
          },
        },
        data: {
          complete_item_info: bundleData.bundle_info_id,
          user_id: bundleData.user_id,
        },
      });
    }

    // Update all non-complete items to associate with this bundle
    if (nonCompleteItemIds && nonCompleteItemIds.length > 0) {
      await prisma.hps_non_complete_item.updateMany({
        where: {
          non_complete_id: {
            in: nonCompleteItemIds,
          },
        },
        data: {
          non_complete_info: bundleData.bundle_info_id,
          user_id: bundleData.user_id,
        },
      });
    }

    return NextResponse.json({
      message: "Bundle updated successfully",
      bundle: updatedBundle,
    });
  } catch (error) {
    console.error("Error updating bundle:", error);
    return NextResponse.json(
      { error: "Failed to update bundle" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bundleData, completeItemIds, nonCompleteItemIds } = body;

    // Validate required data
    if (!bundleData) {
      return NextResponse.json(
        { message: "Missing bundle data" },
        { status: 400 }
      );
    }

    // Add current date and session user; never trust client user_id
    const { user_id: _ignoredUserId, ...safeBundleData } = bundleData;
    const bundleWithDate = {
      ...safeBundleData,
      user_id: userId,
      bundle_date: new Date(),
    };

    // Create transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create bundle info record
      const bundleInfo = await tx.hps_bundle_info.create({
        data: bundleWithDate,
      });

      // 2. Update complete items to link to the new bundle
      if (completeItemIds && completeItemIds.length > 0) {
        await tx.hps_complete_item.updateMany({
          where: {
            complete_item_id: {
              in: completeItemIds,
            },
          },
          data: {
            complete_item_info: bundleInfo.bundle_info_id,
            user_id: userId,
          },
        });
      }

      // 3. Update non-complete items to link to the new bundle
      if (nonCompleteItemIds && nonCompleteItemIds.length > 0) {
        await tx.hps_non_complete_item.updateMany({
          where: {
            non_complete_id: {
              in: nonCompleteItemIds,
            },
          },
          data: {
            non_complete_info: bundleInfo.bundle_info_id,
            user_id: userId,
          },
        });
      }

      return bundleInfo;
    });

    return NextResponse.json({
      message: "Bundle finalized successfully",
      bundleInfo: result,
    });
  } catch (error) {
    console.error("Error finalizing bundle:", error);
    return NextResponse.json(
      { message: "Error finalizing bundle", error: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * Debug API: compare finishingGoods (status=IN) vs stockInHand counts for a bundle_type.
 *
 * finishingGoods uses: del_ind=1 AND complete_item_info != 1
 * stockInHand uses:    del_ind=1 only
 *
 * So the gap = items with del_ind=1 AND complete_item_info=1 (in stockInHand, excluded from finishingGoods).
 *
 * GET /api/stock/debug-counts?bundle_type=P%20%26%20S%20-130x70x275mm
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bundleTypeParam = searchParams.get("bundle_type");
    const bundleType =
      bundleTypeParam && bundleTypeParam !== "all" ? bundleTypeParam : null;

    const whereStockInHand = bundleType
      ? { del_ind: 1, bundle_type: bundleType }
      : { del_ind: 1 };

    const whereFinishingGoodsIn = bundleType
      ? {
          del_ind: 1,
          complete_item_info: { not: 1 },
          bundle_type: bundleType,
        }
      : { del_ind: 1, complete_item_info: { not: 1 } };

    const whereExcludedFromFinishingGoods = bundleType
      ? {
          del_ind: 1,
          complete_item_info: 1,
          bundle_type: bundleType,
        }
      : { del_ind: 1, complete_item_info: 1 };

    // 1) Stock-in-hand logic: del_ind=1 only
    const stockInHandItems = await prisma.hps_complete_item.findMany({
      where: whereStockInHand,
      select: {
        complete_item_id: true,
        complete_item_info: true,
        complete_item_bags: true,
        complete_item_weight: true,
      },
    });

    // 2) Finishing goods "IN" logic: del_ind=1 AND complete_item_info != 1
    const finishingGoodsInItems = await prisma.hps_complete_item.findMany({
      where: whereFinishingGoodsIn,
      select: {
        complete_item_id: true,
        complete_item_info: true,
        complete_item_bags: true,
        complete_item_weight: true,
      },
    });

    // 3) The "gap": in stockInHand but excluded from finishingGoods (complete_item_info=1)
    const excludedItems = await prisma.hps_complete_item.findMany({
      where: whereExcludedFromFinishingGoods,
      select: {
        complete_item_id: true,
        complete_item_info: true,
        complete_item_bags: true,
        complete_item_weight: true,
      },
    });

    const sumBags = (items: { complete_item_bags: string | null }[]) =>
      items.reduce(
        (sum, i) => sum + parseFloat(i.complete_item_bags || "0"),
        0
      );
    const sumWeight = (items: { complete_item_weight: string | null }[]) =>
      items.reduce(
        (sum, i) => sum + parseFloat(i.complete_item_weight || "0"),
        0
      );

    const breakdown = {
      bundle_type_filter: bundleType ?? "(all)",
      stockInHand: {
        description: "del_ind=1 only (what stockInHand API uses)",
        recordCount: stockInHandItems.length,
        totalBags: sumBags(stockInHandItems),
        totalWeight: sumWeight(stockInHandItems),
      },
      finishingGoodsIn: {
        description:
          "del_ind=1 AND complete_item_info != 1 (what finishingGoods status=IN uses)",
        recordCount: finishingGoodsInItems.length,
        totalBags: sumBags(finishingGoodsInItems),
        totalWeight: sumWeight(finishingGoodsInItems),
      },
      excludedFromFinishingGoods: {
        description:
          "del_ind=1 AND complete_item_info=1 (in stockInHand but not in finishingGoods IN)",
        recordCount: excludedItems.length,
        totalBags: sumBags(excludedItems),
        totalWeight: sumWeight(excludedItems),
      },
      explanation:
        "If totalBags differ between stockInHand and finishingGoodsIn, the gap is items with complete_item_info=1.",
    };

    // Optional: breakdown by complete_item_info for this bundle_type
    const byCompleteItemInfo = await prisma.hps_complete_item.groupBy({
      by: ["complete_item_info"],
      where: whereStockInHand,
      _count: true,
    });

    return new Response(
      JSON.stringify({
        breakdown,
        byCompleteItemInfo: byCompleteItemInfo.map((g) => ({
          complete_item_info: g.complete_item_info,
          recordCount: g._count,
        })),
        sampleExcluded:
          excludedItems.length > 0
            ? excludedItems.slice(0, 5).map((i) => ({
                complete_item_id: i.complete_item_id,
                complete_item_info: i.complete_item_info,
                complete_item_bags: i.complete_item_bags,
              }))
            : null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in debug-counts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to run debug counts" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

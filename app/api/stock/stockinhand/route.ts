import { prisma } from "@/lib/prisma";
import { safeParseFloat } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    // First, get all bag types to create a lookup map
    const bagTypes = await prisma.hps_bag_type.findMany({
      select: {
        bag_id: true,
        bag_type: true,
      },
    });

    const bagTypeMap = new Map(bagTypes.map((bt) => [bt.bag_type, bt]));

    // Fetch all items in a single query instead of one per bundle type
    const allItems = await prisma.hps_complete_item.findMany({
      where: {
        del_ind: 1,
        complete_item_info: { not: 1 },
      },
      select: {
        bundle_type: true,
        complete_item_weight: true,
        complete_item_bags: true,
      },
    });

    // Group and sum in memory by bundle_type
    const groupedData = new Map<
      string,
      { totalWeight: number; totalBags: number }
    >();

    for (const item of allItems) {
      const bundleType = item.bundle_type;
      if (!groupedData.has(bundleType)) {
        groupedData.set(bundleType, { totalWeight: 0, totalBags: 0 });
      }

      const group = groupedData.get(bundleType)!;
      group.totalWeight += safeParseFloat(item.complete_item_weight, 0);
      group.totalBags += safeParseFloat(item.complete_item_bags, 0);
    }

    // Map to result format with bag type information
    const result = Array.from(groupedData.entries())
      .map(([bundleType, totals]) => {
        const bagType = bagTypeMap.get(bundleType);

        // Only process items that have a valid bag_id
        if (!bagType || !bagType.bag_id) {
          return null;
        }

        return {
          bag_id: bagType.bag_id,
          bag_type: bagType.bag_type,
          itemweight: totals.totalWeight.toFixed(2),
          itembags: totals.totalBags.toFixed(0),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort the final result by bag_id
    const sortedResult = result.sort((a, b) => a.bag_id - b.bag_id);

    return new Response(JSON.stringify({ data: sortedResult }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching slitting info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

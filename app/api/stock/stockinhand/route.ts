import { prisma } from "@/lib/prisma";

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

    // Get grouped stock data with aggregations (same filter as finishingGoods: exclude complete_item_info=1)
    const stockInHand = await prisma.hps_complete_item.groupBy({
      by: ["bundle_type"],
      where: {
        del_ind: 1,
        complete_item_info: { not: 1 },
      },
      _count: true,
    });

    // Get detailed records for each bundle type to calculate totals
    const result = await Promise.all(
      stockInHand.map(async (group) => {
        const bagType = bagTypeMap.get(group.bundle_type);

        // Only process items that have a valid bag_id
        if (!bagType || !bagType.bag_id) {
          return null;
        }

        // Fetch all records for this bundle type to calculate totals
        const items = await prisma.hps_complete_item.findMany({
          where: {
            bundle_type: group.bundle_type,
            del_ind: 1,
            complete_item_info: { not: 1 },
          },
          select: {
            complete_item_weight: true,
            complete_item_bags: true,
          },
        });

        // Calculate totals manually since fields are strings
        const totalWeight = items.reduce((sum, item) => {
          return sum + parseFloat(item.complete_item_weight || "0");
        }, 0);

        const totalBags = items.reduce((sum, item) => {
          return sum + parseFloat(item.complete_item_bags || "0");
        }, 0);

        return {
          bag_id: bagType.bag_id,
          bag_type: bagType.bag_type,
          itemweight: totalWeight.toFixed(2),
          itembags: totalBags.toFixed(0),
        };
      })
    );

    // Filter out null results
    const filteredResult = result.filter((item) => item !== null);

    // Sort the final result by bag_id
    const sortedResult = filteredResult.sort((a, b) => a.bag_id - b.bag_id);

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

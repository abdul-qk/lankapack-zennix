import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10000, // default: 2000
    timeout: 20000, // default: 5000
  },
});

export async function GET(req: Request) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const stockInHand = await tx.hps_complete_item.groupBy({
        by: ["bundle_type"],
        where: {
          del_ind: 1,
        },
        _count: true,
      });

      const groupResults = await Promise.all(
        stockInHand.map(async (group) => {
          const items = await tx.hps_complete_item.findMany({
            where: {
              bundle_type: group.bundle_type,
              del_ind: 1,
            },
            select: {
              complete_item_weight: true,
              complete_item_bags: true,
            },
          });

          const bagType = await tx.hps_bag_type.findFirst({
            where: {
              bag_type: group.bundle_type,
            },
            select: {
              bag_id: true,
              bag_type: true,
            },
          });

          const totalWeight = items.reduce(
            (sum, item) => sum + (parseFloat(item.complete_item_weight) || 0),
            0
          );
          const totalBags = items.reduce(
            (sum, item) => sum + (parseFloat(item.complete_item_bags) || 0),
            0
          );

          // Only return items that have a valid bag_id
          if (!bagType || !bagType.bag_id) {
            return null;
          }

          return {
            bag_id: bagType.bag_id,
            bag_type: bagType.bag_type,
            itemweight: totalWeight.toFixed(2),
            itembags: totalBags.toFixed(0),
          };
        })
      );

      // Filter out null values (items without valid bag_id)
      return groupResults.filter(result => result !== null);
    });


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

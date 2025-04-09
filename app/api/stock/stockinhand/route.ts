import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const stockInHand = await prisma.hps_complete_item.groupBy({
      by: ["bundle_type"],
      where: {
        del_ind: 1,
      },
      _count: true,
    });

    const result = await Promise.all(
      stockInHand.map(async (group) => {
        const items = await prisma.hps_complete_item.findMany({
          where: {
            bundle_type: group.bundle_type,
            del_ind: 1,
          },
          select: {
            complete_item_weight: true,
            complete_item_bags: true,
          },
        });

        const bagType = await prisma.hps_bag_type.findFirst({
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

        return {
          bag_id: bagType?.bag_id ?? 0, // Ensure we have a number for sorting
          bag_type: bagType?.bag_type,
          itemweight: totalWeight.toFixed(2),
          itembags: totalBags.toFixed(0),
        };
      })
    );

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

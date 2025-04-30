import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id, 10);
    if (isNaN(jobCardId)) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
      });
    }

    const slittingInfo = await prisma.hps_jobcard.findFirst({
      include: {
        customer: true,
        particular: true,
      },
      where: {
        job_card_id: jobCardId,
        OR: [
          { section_list: "1" },
          { section_list: { startsWith: "1," } },
          { section_list: { endsWith: ",1" } },
          { section_list: { contains: ",1," } },
        ],
      },
    });

    // Fetch slitting data first
    const basicSlittingData = await prisma.hps_slitting.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    // Now retrieve the weights from hps_stock for each roll_barcode_no
    const slittingData = await Promise.all(
      basicSlittingData.map(async (slitting) => {
        // Converting the barcode string to BigInt for comparison with hps_stock.stock_barcode
        const stockItem = await prisma.hps_stock.findFirst({
          where: {
            stock_barcode: BigInt(slitting.roll_barcode_no),
          },
          select: {
            item_net_weight: true,
          },
        });

        // Return the slitting data with the added net_weight field
        return {
          ...slitting,
          net_weight: stockItem?.item_net_weight || null,
        };
      })
    );

    const slittingRollData = await prisma.hps_slitting_roll.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    if (!slittingInfo) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ data: slittingInfo, slittingData, slittingRollData }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching slitting info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

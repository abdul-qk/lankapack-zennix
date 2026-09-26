import { prisma } from "@/lib/prisma";

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

    const sheetingInfo = await prisma.hps_jobcard.findFirst({
      include: {
        customer: true,
        particular: true,
        cut_types: true,
        cut_bag_types: true,
      },
      where: {
        job_card_id: jobCardId,
        OR: [
          { section_list: "4" },
          { section_list: { startsWith: "4," } },
          { section_list: { endsWith: ",4" } },
          { section_list: { contains: ",4," } },
        ],
      },
    });

    const basicSheetingData = await prisma.hps_sheeting.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    const sheetingData = await Promise.all(
      basicSheetingData.map(async (sheeting) => {
        // Converting the barcode string to BigInt for comparison with hps_stock.stock_barcode
        const stockItem = await prisma.hps_stock.findFirst({
          where: {
            stock_barcode: BigInt(sheeting.roll_barcode_no),
          },
          select: {
            item_net_weight: true,
          },
        });

        // Return the slitting data with the added net_weight field
        return {
          ...sheeting,
          net_weight: stockItem?.item_net_weight || null,
        };
      })
    );

    const sheetingRollData = await prisma.hps_sheeting_roll.findMany({
      where: {
        job_card_id: jobCardId,
      },
      orderBy: [{ add_date: "asc" }, { sheeting_roll_id: "asc" }],
    });

    if (!sheetingInfo) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    let sheetTypeName: string | null = null;
    if (sheetingInfo.sheeting_barcode) {
      const sheetTypeId = parseInt(sheetingInfo.sheeting_barcode, 10);
      if (!isNaN(sheetTypeId)) {
        const sheetType = await prisma.hps_sheet_type.findUnique({
          where: { sheet_id: sheetTypeId },
        });
        sheetTypeName = sheetType?.sheet_type || null;
      }
    }

    return new Response(
      JSON.stringify({
        data: { ...sheetingInfo, sheetTypeName },
        sheetingData,
        sheetingRollData,
      }),
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

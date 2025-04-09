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

    const cuttingInfo = await prisma.hps_jobcard.findFirst({
      include: {
        customer: true,
        particular: true,
        cut_types: true,
        cut_bag_types: true,
      },
      where: {
        job_card_id: jobCardId,
        OR: [
          { section_list: "3" },
          { section_list: { startsWith: "3," } },
          { section_list: { endsWith: ",3" } },
          { section_list: { contains: ",3," } },
        ],
      },
    });

    const cuttingData = await prisma.hps_cutting.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    const cuttingRollData = await prisma.hps_cutting_roll.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    if (!cuttingInfo) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ data: cuttingInfo, cuttingData, cuttingRollData }),
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

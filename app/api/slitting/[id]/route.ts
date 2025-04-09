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

    const slittingData = await prisma.hps_slitting.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

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

    return new Response(JSON.stringify({ data: slittingInfo, slittingData, slittingRollData }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching slitting info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

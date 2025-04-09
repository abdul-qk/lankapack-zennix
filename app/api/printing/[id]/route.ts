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

    const printingInfo = await prisma.hps_jobcard.findFirst({
      include: {
        customer: true,
        particular: true,
        print_size: true,
      },
      where: {
        job_card_id: jobCardId,
        OR: [
          { section_list: "2" },
          { section_list: { startsWith: "2," } },
          { section_list: { endsWith: ",2" } },
          { section_list: { contains: ",2," } },
        ],
      },
    });

    const printingData = await prisma.hps_print.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    const printingPackData = await prisma.hps_print_pack.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    if (!printingInfo) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ data: printingInfo, printingData, printingPackData }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching slitting info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

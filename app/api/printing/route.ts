// Get all data from hps_slitting
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const printingInfo = await prisma.hps_jobcard.findMany({
      include: {
        customer: true,
        particular: true,
      },
      where: {
        OR: [
          { section_list: "2" },
          { section_list: { startsWith: "2," } },
          { section_list: { endsWith: ",2" } },
          { section_list: { contains: ",2," } },
        ],
      },
    });

    return new Response(JSON.stringify({ data: printingInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching printing info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

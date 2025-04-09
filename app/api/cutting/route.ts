// Get all data from hps_slitting
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const slittingInfo = await prisma.hps_jobcard.findMany({
      include: {
        customer: true,
        particular: true,
      },
      where: {
        OR: [
          { section_list: "3" },
          { section_list: { startsWith: "3," } },
          { section_list: { endsWith: ",3" } },
          { section_list: { contains: ",3," } },
        ],
      },
    });

    return new Response(JSON.stringify({ data: slittingInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching slitting info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

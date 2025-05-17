export const dynamic = "force-dynamic";
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
          { section_list: "1" },
          { section_list: { startsWith: "1," } },
          { section_list: { endsWith: ",1" } },
          { section_list: { contains: ",1," } },
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

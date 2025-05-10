import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const colorInfo = await prisma.hps_cutting_roll.findMany({});

    return new Response(JSON.stringify({ data: colorInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching color info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

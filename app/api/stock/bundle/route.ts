import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const bundleInfo = await prisma.hps_bundle_info.findMany({
      include: {
        cutting_roll: true
      },
    });

    return new Response(JSON.stringify({ data: bundleInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching bundles info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
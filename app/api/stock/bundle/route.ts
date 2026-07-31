export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Fetch all bundle info; order by newest first so pagination is predictable
    const bundleInfo = await prisma.hps_bundle_info.findMany({
      include: {
        cutting_roll: true,
      },
      orderBy: {
        bundle_info_id: "desc",
      },
    });

    return new Response(JSON.stringify({ data: bundleInfo }), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching bundles info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
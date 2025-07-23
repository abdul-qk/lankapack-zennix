import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch all filtered material info data
    const colorInfo = await prisma.hps_colour.findFirst({
      where: { colour_id: parseInt(params.id, 10) },
    });

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

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const itemId = parseInt(params.id, 10);

  try {
    const uniqueValues = await prisma.hps_stock.findMany({
      where: {
        material_item_particular: itemId, // Filter by the provided ID
      },
      select: {
        item_gsm: true,
        material_item_size: true,
      },
      distinct: ["item_gsm", "material_item_size"], // Get unique combinations
    });

    return new Response(JSON.stringify({ uniqueValues }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching job card info:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

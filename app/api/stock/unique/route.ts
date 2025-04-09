import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const uniqueValues = await prisma.hps_stock.findMany({
      select: {
        item_gsm: true,
        material_item_size: true,
      },
      distinct: ["item_gsm", "material_item_size"],
    });

    return new Response(JSON.stringify({ data: uniqueValues }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch stock gsm and size data",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}

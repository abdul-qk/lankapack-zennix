import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data with valid suppliers
    const materialItems = await prisma.hps_material_item.findMany({
        include: {
            particular: {
                select: {
                    particular_name: true,
                }
            },
        },
        distinct: ['material_item_size'],

    });
    console.log(materialItems);


    return new Response(JSON.stringify({ data: materialItems }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching material items:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
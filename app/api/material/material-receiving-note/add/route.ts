export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const suppliers = await prisma.hps_supplier.findMany();
    const particulars = await prisma.hps_particular.findMany();
    const colours = await prisma.hps_colour.findMany();

    // Fetch temporary items (material_info_id = 1)
    // const tempItems = await prisma.hps_material_item.findMany({
    //   where: {
    //     material_info_id: 1,
    //   },
    //   include: {
    //     particular: true, // Include related particular data if needed on the frontend
    //   },
    // });

    return new Response(JSON.stringify({ suppliers, particulars, colours }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

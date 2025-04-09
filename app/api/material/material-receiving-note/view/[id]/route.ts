import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const materialId = parseInt(params.id, 10);

  if (isNaN(materialId)) {
    return new Response(JSON.stringify({ error: "Invalid Material ID" }), {
      status: 400,
    });
  }

  try {
    // Fetch the material info, supplier, and material items
    const materialInfo = await prisma.hps_material_info.findUnique({
      where: { material_info_id: materialId },
      include: {
        supplier: true,
        material_items: {
          include: {
            particular: true, // Include particular details
          },
        },
      },
    });

    if (!materialInfo) {
      return new Response(JSON.stringify({ error: "Material not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(materialInfo), { status: 200 });
  } catch (error) {
    console.error("Error fetching material info:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

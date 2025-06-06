import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data with valid suppliers
    const materialInfo = await prisma.hps_material_info.findMany({
      where: {
        material_supplier: {
          not: 1,
        },
      },
      include: {
        supplier: true,
      },
    });

    return new Response(JSON.stringify({ data: materialInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching material info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    // Use a transaction to ensure both operations complete or neither does
    await prisma.$transaction(async (tx) => {
      // First delete all related material items
      await tx.hps_material_item.deleteMany({
        where: { material_info_id: id },
      });

      // Then delete the material info record
      await tx.hps_material_info.delete({
        where: { material_info_id: id },
      });
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting material info:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

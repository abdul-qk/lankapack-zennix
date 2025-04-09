import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { item_id: string } }
) {
  try {
    const itemId = parseInt(params.item_id, 10);

    // Remove total_reels from material info and subtract netweight and grossweight
    const materialInfo = await prisma.hps_material_item.findUnique({
      where: { material_item_id: itemId },
      include: { material_info: true },
    });

    console.log(materialInfo);

    if (materialInfo) {
      const totalReels = materialInfo.material_info.total_reels - 1; // Subtract 1 from total reels
      const total_net_weight =
        materialInfo.material_info.total_net_weight -
        parseFloat(materialInfo.material_item_net_weight);
      const total_gross_weight =
        materialInfo.material_info.total_gross_weight -
        parseFloat(materialInfo.material_item_gross_weight);

      await prisma.hps_material_info.update({
        where: { material_info_id: materialInfo.material_info_id },
        data: {
          total_reels: totalReels,
          total_net_weight: total_net_weight,
          total_gross_weight: total_gross_weight,
        },
      });
    }

    await prisma.hps_material_item.delete({
      where: { material_item_id: itemId },
    });

    return new Response(
      JSON.stringify({ message: "Item deleted successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    return new Response(JSON.stringify({ error: "Failed to delete item" }), {
      status: 500,
    });
  }
}

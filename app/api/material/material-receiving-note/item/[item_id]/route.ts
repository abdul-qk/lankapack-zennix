import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { item_id: string } }
) {
  try {
    const itemId = parseInt(params.item_id, 10);

    // Find material item with its info and related stock record
    const materialInfo = await prisma.hps_material_item.findUnique({
      where: { material_item_id: itemId },
      include: { 
        material_info: true,
        stocks: true
      },
    });

    console.log(materialInfo);
    // return;

    if (!materialInfo) {
      return new Response(JSON.stringify({ error: "Material item not found" }), {
        status: 404,
      });
    }

    // Use transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // Only update material_info totals if it's not a temporary addition (material_info_id !== 1)
      if (materialInfo.material_info_id !== 1) {
        const totalReels = materialInfo.material_info.total_reels - 1;
        const total_net_weight =
          materialInfo.material_info.total_net_weight -
          parseFloat(materialInfo.material_item_net_weight);
        const total_gross_weight =
          materialInfo.material_info.total_gross_weight -
          parseFloat(materialInfo.material_item_gross_weight);

        await tx.hps_material_info.update({
          where: { material_info_id: materialInfo.material_info_id },
          data: {
            total_reels: totalReels,
            total_net_weight: total_net_weight,
            total_gross_weight: total_gross_weight,
          },
        });
      }

      // Delete stock record if it exists
      if (materialInfo.stocks && materialInfo.stocks.length > 0) {
        console.log("Stock Id: " + materialInfo.stocks[0].stock_id);
        await tx.hps_stock.delete({
          where: { stock_id: materialInfo.stocks[0].stock_id },
        });
      }

      // Delete the material item
      await tx.hps_material_item.delete({
        where: { material_item_id: itemId },
      });
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

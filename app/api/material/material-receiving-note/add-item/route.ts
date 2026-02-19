import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { item } = await req.json();

    // Use transaction to handle both material item creation and material info update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the material item
      const newItem = await tx.hps_material_item.create({
        data: {
          material_info_id: item.material_info_id || 1, // Use temporary material_info_id as 1 if not set
          material_item_reel_no: item.material_item_reel_no,
          material_item_particular: item.material_item_particular,
          material_item_variety: item.material_item_variety,
          material_item_gsm: item.material_item_gsm,
          material_item_size: item.material_item_size,
          material_item_net_weight: item.material_item_net_weight,
          material_item_gross_weight: item.material_item_gross_weight,
          material_colour: item.material_colour,
          material_item_barcode: "", // Initialize barcode as empty
          added_date: new Date(),
          user_id: 1, // Assuming user ID 1 for now
          material_status: 1, // Assuming status 1 for active
        },
      });

      // 2. Generate the barcode
      const reelNoString = String(item.material_item_reel_no || '');
      const barcode = `${newItem.material_item_id}${reelNoString}`;

      // 3. Update the item with the barcode
      const updatedItem = await tx.hps_material_item.update({
        where: { material_item_id: newItem.material_item_id },
        data: {
          material_item_barcode: barcode,
        },
      });

      // 4. If material_info_id is provided, update the material_info table and create stock entry
      if (item.material_info_id) {
        // Get current material info
        const materialInfo = await tx.hps_material_info.findUnique({
          where: { material_info_id: item.material_info_id },
          select: {
            total_reels: true,
            total_net_weight: true,
            total_gross_weight: true,
          },
        });

        if (materialInfo) {
          // Calculate new totals
          const newTotalReels = (materialInfo.total_reels || 0) + 1;
          const newTotalNetWeight = (materialInfo.total_net_weight || 0) + parseFloat(item.material_item_net_weight);
          const newTotalGrossWeight = (materialInfo.total_gross_weight || 0) + parseFloat(item.material_item_gross_weight);

          // Update material info with new totals
          await tx.hps_material_info.update({
            where: { material_info_id: item.material_info_id },
            data: {
              total_reels: newTotalReels,
              total_net_weight: newTotalNetWeight,
              total_gross_weight: newTotalGrossWeight,
            },
          });

          // Create stock entry
          await tx.hps_stock.create({
            data: {
              material_item_particular: item.material_item_particular || 0,
              material_used_buy: 1,
              main_id: item.material_info_id,
              material_item_id: updatedItem.material_item_id,
              item_gsm: item.material_item_gsm,
              stock_barcode: BigInt(barcode),
              material_item_size: item.material_item_size,
              item_net_weight: item.material_item_net_weight,
              stock_date: new Date(),
              material_status: 0
            }
          });
        }
      }

      return updatedItem;
    });

    return NextResponse.json(result, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Error adding material item:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
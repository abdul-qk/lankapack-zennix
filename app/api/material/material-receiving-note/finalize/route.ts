import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { material_supplier, itemIds } = await req.json();

    if (!material_supplier || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "Missing or invalid supplier ID or item IDs" }, { status: 400 });
    }

    // Execute all database operations within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the items added with the temporary ID (1) using the provided itemIds
      const itemsToUpdate = await tx.hps_material_item.findMany({
        where: {
          material_item_id: {
            in: itemIds,
          },
          material_info_id: 1, // Ensure we only update items with the temporary ID
        },
      });

      if (itemsToUpdate.length !== itemIds.length) {
        console.warn(`Mismatch: Expected ${itemIds.length} items, found ${itemsToUpdate.length} with temp ID 1.`);
        if (itemsToUpdate.length === 0) {
          throw new Error("No valid items found to finalize.");
        }
      }

      // 2. Calculate totals from the fetched items
      let total_net_weight = 0.0;
      let total_gross_weight = 0.0;
      const total_reels = itemsToUpdate.length;

      for (const item of itemsToUpdate) {
        total_net_weight += parseFloat(item.material_item_net_weight);
        total_gross_weight += parseFloat(item.material_item_gross_weight);
      }

      // 3. Create the main material info record
      const newMaterialInfo = await tx.hps_material_info.create({
        data: {
          material_supplier: parseInt(material_supplier),
          total_reels: total_reels,
          total_net_weight: total_net_weight,
          total_gross_weight: total_gross_weight,
          add_date: new Date(),
          user_id: 1, // Assuming user ID 1
          material_info_status: 1, // Assuming status 1
        },
      });

      const newMaterialInfoId = newMaterialInfo.material_info_id;

      // 4. Update the material_info_id for the items
      const updatedItemIds = itemsToUpdate.map(item => item.material_item_id);

      await tx.hps_material_item.updateMany({
        where: {
          material_item_id: {
            in: updatedItemIds,
          },
        },
        data: {
          material_info_id: newMaterialInfoId,
        },
      });

      // 5. Create stock entries for each material item
      const stockEntries = itemsToUpdate.map(item => ({
        material_item_particular: item.material_item_particular || 0,
        material_used_buy: 1,
        main_id: newMaterialInfoId,
        material_item_id: item.material_item_id,
        item_gsm: item.material_item_gsm,
        stock_barcode: BigInt(item.material_item_barcode),
        material_item_size: item.material_item_size,
        item_net_weight: item.material_item_net_weight,
        stock_date: new Date(),
        material_status: 0
      }));

      await tx.hps_stock.createMany({
        data: stockEntries
      });

      return { newMaterialInfoId, itemCount: itemsToUpdate.length };
    });

    return NextResponse.json({
      message: "Material Receiving Note finalized successfully",
      material_info_id: result.newMaterialInfoId,
      items_processed: result.itemCount
    }, { status: 200 });

  } catch (error) {
    console.error("Error finalizing material receiving note:", error);
    let errorMessage = "Failed to finalize material receiving note";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
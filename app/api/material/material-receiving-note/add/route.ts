import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const suppliers = await prisma.hps_supplier.findMany();
    const particulars = await prisma.hps_particular.findMany();
    const colours = await prisma.hps_colour.findMany();

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

export async function POST(req: Request) {
  try {
    const { materialInfo } = await req.json();
    const materialItems = materialInfo.material_items;
    const material_supplier = materialInfo.material_supplier;

    // Count total netweight and grossweight from material items
    var total_net_weight = 0.0;
    var total_gross_weight = 0.0;
    var total_reels = 0;

    for (const materialItem of materialItems) {
      total_reels += 1;
      total_net_weight += parseFloat(materialItem.material_item_net_weight);
      total_gross_weight += parseFloat(materialItem.material_item_gross_weight);
    }

    // Update material info
    const newMaterialInfo = await prisma.hps_material_info.create({
      data: {
        material_supplier: parseInt(material_supplier),
        total_reels: total_reels,
        total_net_weight: total_net_weight,
        total_gross_weight: total_gross_weight,
        add_date: new Date(),
        user_id: 1,
        material_info_status: 1,
      },
    });

    const newItemId = newMaterialInfo.material_info_id;

    // Update material items
    for (const materialItem of materialItems) {
      // 1. Create the record
      const newItem = await prisma.hps_material_item.create({
        data: {
          material_info_id: newItemId,
          material_item_reel_no: materialItem.material_item_reel_no,
          material_item_particular: materialItem.material_item_particular,
          material_item_variety: materialItem.material_item_variety,
          material_item_gsm: materialItem.material_item_gsm,
          material_item_size: materialItem.material_item_size,
          material_item_net_weight: materialItem.material_item_net_weight,
          material_item_gross_weight: materialItem.material_item_gross_weight,
          material_colour: materialItem.material_colour,
          material_item_barcode: "",
          added_date: new Date(),
          user_id: 1,
          material_status: 1,
        },
      });

      // 2. Generate the barcode
      const barcode = `${newItem.material_item_id}${materialItem.material_item_reel_no}`;

      // 3. Update the record *with* the barcode
      await prisma.hps_material_item.update({
        where: { material_item_id: newItem.material_item_id }, // Use the ID from the created record
        data: {
          material_item_barcode: barcode,
        },
      });
    }

    return new Response(
      JSON.stringify({ message: "Material updated successfully" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating material info:", error);
    return new Response(JSON.stringify({ error: "Failed to update data" }), {
      status: 500,
    });
  }
}

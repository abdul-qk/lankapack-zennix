import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const materialId = parseInt(params.id, 10);

  try {
    const materialInfo = await prisma.hps_material_info.findUnique({
      where: { material_info_id: materialId },
      include: {
        supplier: true,
        material_items: {
          include: {
            particular: true,
          },
        },
      },
    });

    const suppliers = await prisma.hps_supplier.findMany();
    const particulars = await prisma.hps_particular.findMany();
    const colours = await prisma.hps_colour.findMany();

    return new Response(
      JSON.stringify({ materialInfo, suppliers, particulars, colours }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = parseInt(params.id, 10);
    const { materialData, materialItems } = await req.json();

    // Update material info
    await prisma.hps_material_info.update({
      where: { material_info_id: materialId },
      data: materialData,
    });

    // Update or create material items
    for (const item of materialItems) {
      if (item.material_item_id) {
        await prisma.hps_material_item.update({
          where: { material_item_id: item.material_item_id },
          data: item,
        });
      } else {
        await prisma.hps_material_item.create({
          data: { ...item, material_info_id: materialId },
        });
      }
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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = parseInt(params.id, 10);
    const { materialInfo } = await req.json();

    // Update material info
    await prisma.hps_material_info.update({
      where: { material_info_id: materialId },
      data: {
        material_supplier: materialInfo.material_supplier,
      },
    });

    // Handle material items
    for (const item of materialInfo.material_items) {
      if (item.material_item_id && item.material_item_id !== 0) {
        // Update existing material item
        await prisma.hps_material_item.update({
          where: { material_item_id: item.material_item_id },
          data: {
            material_item_reel_no: item.material_item_reel_no,
            material_colour: item.material_colour,
            material_item_particular: item.material_item_particular,
            material_item_variety: item.material_item_variety,
            material_item_gsm: item.material_item_gsm,
            material_item_size: item.material_item_size,
            material_item_net_weight: item.material_item_net_weight,
            material_item_gross_weight: item.material_item_gross_weight,
          },
        });

        // Calculate total netweight and grossweight (should update based on the edit item)
        await prisma.hps_material_info.update({
          where: { material_info_id: materialId },
          data: {
            total_net_weight: {
              increment:
                parseFloat(item.material_item_net_weight) -
                parseFloat(item.material_item_net_weight),
            },
            total_gross_weight: {
              increment:
                parseFloat(item.material_item_gross_weight) -
                parseFloat(item.material_item_gross_weight),
            },
          },
        });
      } else {
        // Create a new material item
        await prisma.hps_material_item.create({
          data: {
            material_info_id: materialId,
            material_item_reel_no: item.material_item_reel_no,
            material_colour: item.material_colour,
            material_item_particular: item.material_item_particular,
            material_item_variety: item.material_item_variety,
            material_item_gsm: item.material_item_gsm,
            material_item_size: item.material_item_size,
            material_item_net_weight: item.material_item_net_weight,
            material_item_gross_weight: item.material_item_gross_weight,
            material_item_barcode: "00000000",
            added_date: new Date(),
            user_id: 1,
            material_status: 1,
          },
        });

        await prisma.hps_material_info.update({
          where: { material_info_id: materialId },
          data: {
            total_reels: { increment: 1 },
            total_net_weight: {
              increment: parseFloat(item.material_item_net_weight),
            },
            total_gross_weight: {
              increment: parseFloat(item.material_item_gross_weight),
            },
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ message: "Material updated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating material info:", error);
    return new Response(JSON.stringify({ error: "Failed to update data" }), {
      status: 500,
    });
  }
}

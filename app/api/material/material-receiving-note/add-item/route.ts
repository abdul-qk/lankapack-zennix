import { PrismaClient } from "@prisma/client";
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { item } = await req.json();

    // 1. Create the record with temporary material_info_id = 1
    const newItem = await prisma.hps_material_item.create({
      data: {
        material_info_id: 1, // Use temporary ID
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
    // Ensure reel number is treated as string, handle potential null/undefined if necessary
    const reelNoString = String(item.material_item_reel_no || ''); 
    const barcode = `${newItem.material_item_id}${reelNoString}`;

    // 3. Update the record *with* the barcode
    const updatedItem = await prisma.hps_material_item.update({
      where: { material_item_id: newItem.material_item_id },
      data: {
        material_item_barcode: barcode,
      },
    });

    // Return the fully created and updated item
    return NextResponse.json(updatedItem, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Error adding material item:", error);
    // Provide more specific error messages if possible
    let errorMessage = "Failed to add item";
    if (error instanceof Error) {
        // Check for specific Prisma errors if needed
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
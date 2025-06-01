import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch all complete items
export async function GET() {
  try {
    const items = await prisma.hps_complete_item.findMany({
      where: {
        del_ind: 1,
        complete_item_info: 1,
      },
      orderBy: {
        complete_item_id: "desc",
      },
    });

    return NextResponse.json({
      message: "Complete items fetched successfully",
      items,
    });
  } catch (error) {
    console.error("Error fetching complete items:", error);
    return NextResponse.json(
      { message: "Error fetching complete items", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create a new complete item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.bundle_type ||
      !body.complete_item_weight ||
      !body.complete_item_bags ||
      !body.complete_item_info
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate barcode with format: id + current date (ddmmyyhhmmss)
    const now = new Date();
    const dateFormat = `${String(now.getDate()).padStart(2, "0")}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}${String(
      now.getHours()
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    // Create the new complete item
    const completeItem = await prisma.hps_complete_item.create({
      data: {
        complete_item_info: Number(body.complete_item_info) || 1,
        bundle_type: body.bundle_type,
        complete_item_weight: body.complete_item_weight,
        complete_item_bags: body.complete_item_bags,
        complete_item_date: now,
        user_id: body.user_id || 1,
        del_ind: 1,
        // We'll update the barcode after we know the ID
        complete_item_barcode: "temp",
      },
    });

    // Update the barcode with the actual ID prepended
    const barcode = `${completeItem.complete_item_id}${dateFormat}`;

    await prisma.hps_complete_item.update({
      where: {
        complete_item_id: completeItem.complete_item_id,
      },
      data: {
        complete_item_barcode: barcode,
      },
    });

    // Get the updated record
    const updatedItem = await prisma.hps_complete_item.findUnique({
      where: {
        complete_item_id: completeItem.complete_item_id,
      },
    });

    return NextResponse.json({
      message: "Complete item created successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error creating complete item:", error);
    return NextResponse.json(
      { message: "Error creating complete item", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all non-complete items
export async function GET() {
  try {
    const items = await prisma.hps_non_complete_item.findMany({
      where: {
        del_ind: 1,
      },
      orderBy: {
        non_complete_id: "desc",
      },
    });

    return NextResponse.json({
      message: "Non-complete items fetched successfully",
      items,
    });
  } catch (error) {
    console.error("Error fetching non-complete items:", error);
    return NextResponse.json(
      { message: "Error fetching non-complete items", error: String(error) },
      { status: 500 }
    );
  }
}

// POST: Create a new non-complete item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.non_complete_weight || !body.non_complete_bags) {
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

    // Create the new non-complete item
    const nonCompleteItem = await prisma.hps_non_complete_item.create({
      data: {
        non_complete_info: body.non_complete_info || 1,
        non_complete_weight: body.non_complete_weight,
        non_complete_bags: body.non_complete_bags,
        user_id: body.user_id || 1,
        del_ind: body.del_ind || 1,
        // We'll update the barcode after we know the ID
        non_complete_barcode: "temp",
      },
    });

    // Update the barcode with the actual ID prepended
    const barcode = `${nonCompleteItem.non_complete_id}${dateFormat}`;

    await prisma.hps_non_complete_item.update({
      where: {
        non_complete_id: nonCompleteItem.non_complete_id,
      },
      data: {
        non_complete_barcode: barcode,
      },
    });

    // Get the updated record
    const updatedItem = await prisma.hps_non_complete_item.findUnique({
      where: {
        non_complete_id: nonCompleteItem.non_complete_id,
      },
    });

    return NextResponse.json({
      message: "Non-complete item created successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error creating non-complete item:", error);
    return NextResponse.json(
      { message: "Error creating non-complete item", error: String(error) },
      { status: 500 }
    );
  }
}

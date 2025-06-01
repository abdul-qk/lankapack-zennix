import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = parseInt(params.id);

    if (isNaN(bundleId)) {
      return NextResponse.json({ error: "Invalid bundle ID" }, { status: 400 });
    }

    // Fetch complete items related to this bundle
    const items = await prisma.hps_complete_item.findMany({
      where: {
        complete_item_info: bundleId,
        // del_ind: 1, // Assuming 1 means active/not deleted
      },
      orderBy: {
        complete_item_id: "desc",
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching complete items:", error);
    return NextResponse.json(
      { error: "Failed to fetch complete items" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Delete a complete item (soft delete by updating del_ind to 0)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    // Check if the item exists
    const item = await prisma.hps_complete_item.findUnique({
      where: {
        complete_item_id: id,
      },
    });

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Soft delete by updating del_ind to 0
    await prisma.hps_complete_item.delete({
      where: {
        complete_item_id: id,
      },
    });

    return NextResponse.json({
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { message: "Error deleting item", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

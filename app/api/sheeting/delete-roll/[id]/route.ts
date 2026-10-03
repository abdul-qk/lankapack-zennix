// /app/api/sheeting/delete-barcode/[sheetingId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const sheetingId = parseInt(params.id);

    if (isNaN(sheetingId)) {
      return NextResponse.json(
        { error: "Invalid sheeting ID" },
        { status: 400 }
      );
    }

    // Hard delete the sheeting record
    await prisma.hps_sheeting_roll.delete({
      where: { sheeting_roll_id: sheetingId },
    });

    return NextResponse.json(
      { success: true, message: "Barcode deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting barcode:", error);
    return NextResponse.json(
      { error: "Failed to delete barcode" },
      { status: 500 }
    );
  }
}

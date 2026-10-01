// /app/api/sheeting/[id]/add-roll/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobCardId = parseInt(params.id);
    const { sheeting_id, sheeting_roll_weight, no_of_bags, sheeting_wastage } =
      await request.json();

    // Validate inputs
    if (
      !jobCardId ||
      !sheeting_id ||
      sheeting_roll_weight === undefined || sheeting_roll_weight === null ||
      no_of_bags === undefined || no_of_bags === null ||
      sheeting_wastage === undefined || sheeting_wastage === null
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const highestRollRecord = await prisma.hps_sheeting_roll.findFirst({
      orderBy: {
        sheeting_roll_id: "desc",
      },
      select: {
        sheeting_roll_id: true,
      },
    });

    const nextId = (highestRollRecord?.sheeting_roll_id || 0) + 1;

    // Generate a unique barcode for this sheeting roll
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const formattedDate = `${day}-${month}-${year}${hours}:${minutes}:${seconds}`;
    // Remove non-numeric characters
    const numericDate = formattedDate.replace(/[^0-9]/g, "");
    // Create barcode by concatenating nextId and numericDate
    const sheetingBarcode = `${nextId}${numericDate}`;

    // Create new sheeting roll record
    const newSheetingRoll = await prisma.hps_sheeting_roll.create({
      data: {
        job_card_id: jobCardId,
        sheeting_id: sheeting_id,
        sheeting_roll_weight,
        no_of_bags,
        sheeting_wastage,
        sheeting_barcode: sheetingBarcode,
        add_date: new Date(),
        user_id: userId,
        del_ind: 1,
      },
    });

    return NextResponse.json(
      { success: true, data: newSheetingRoll },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding sheeting roll:", error);
    return NextResponse.json(
      { error: "Failed to add sheeting roll" },
      { status: 500 }
    );
  }
}

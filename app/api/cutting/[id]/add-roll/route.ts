// /app/api/cutting/[id]/add-roll/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { cutting_id, cutting_roll_weight, no_of_bags, cutting_wastage } =
      await request.json();

    // Validate inputs
    if (
      !jobCardId ||
      !cutting_id ||
      !cutting_roll_weight ||
      !no_of_bags ||
      !cutting_wastage
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const highestRollRecord = await prisma.hps_cutting_roll.findFirst({
      orderBy: {
        cutting_roll_id: "desc",
      },
      select: {
        cutting_roll_id: true,
      },
    });

    const nextId = (highestRollRecord?.cutting_roll_id || 0) + 1;

    // Generate a unique barcode for this cutting roll
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
    const cuttingBarcode = `${nextId}${numericDate}`;

    // Create new cutting roll record
    const newCuttingRoll = await prisma.hps_cutting_roll.create({
      data: {
        job_card_id: jobCardId,
        cutting_id: cutting_id,
        cutting_roll_weight,
        no_of_bags,
        cutting_wastage,
        cutting_barcode: cuttingBarcode,
        add_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 1,
      },
    });

    return NextResponse.json(
      { success: true, data: newCuttingRoll },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding cutting roll:", error);
    return NextResponse.json(
      { error: "Failed to add cutting roll", details: error.message },
      { status: 500 }
    );
  }
}

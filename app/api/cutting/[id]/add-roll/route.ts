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

    // Generate a unique barcode for this cutting roll
    const timestamp = Date.now().toString();
    const randomDigits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const barcode = `CR${cutting_id}${timestamp.substring(
      timestamp.length - 6
    )}${randomDigits}`;

    // Create new cutting roll record
    const newCuttingRoll = await prisma.hps_cutting_roll.create({
      data: {
        job_card_id: jobCardId,
        cutting_id: cutting_id,
        cutting_roll_weight,
        no_of_bags,
        cutting_wastage,
        cutting_barcode: barcode,
        add_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 0,
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

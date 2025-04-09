import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const barcode = params.id;

    if (!barcode) {
      return NextResponse.json(
        { message: "Missing barcode parameter" },
        { status: 400 }
      );
    }

    const result = await prisma.hps_cutting_roll.findFirst({
      where: {
        cutting_barcode: barcode,
      },
      select: {
        no_of_bags: true,
        job_card_id: true,
        cutting_wastage: true,
      },
    });

    if (!result) {
      return NextResponse.json(
        { message: "Cutting roll not found" },
        { status: 404 }
      );
    }

    // Get associated job card with bag type
    const jobcard = await prisma.hps_jobcard.findUnique({
      where: {
        job_card_id: result.job_card_id,
      },
      select: {
        cut_bag_types: {
          select: {
            bag_type: true,
          },
        },
      },
    });

    // Get wastage data
    const slittingWastage = await prisma.hps_slitting_wastage.findFirst({
      where: {
        job_card_id: result.job_card_id,
      },
      select: {
        slitting_wastage: true,
      },
    });

    const printWastage = await prisma.hps_print_wastage.findFirst({
      where: {
        job_card_id: result.job_card_id,
      },
      select: {
        print_wastage: true,
      },
    });

    const data = {
      no_of_bags: result.no_of_bags,
      bag_type: jobcard?.cut_bag_types?.bag_type || "",
      slitting_wastage: slittingWastage?.slitting_wastage || "0",
      print_wastage: printWastage?.print_wastage || "0",
      cutting_wastage: result?.cutting_wastage || "0",
    };

    return NextResponse.json({
      message: "Data fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Error fetching data", error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

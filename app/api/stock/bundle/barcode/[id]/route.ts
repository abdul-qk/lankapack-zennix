import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getJobCardBagType(jobCardId: number) {
  const jobcard = await prisma.hps_jobcard.findUnique({
    where: { job_card_id: jobCardId },
    select: {
      cut_bag_types: {
        select: { bag_type: true },
      },
    },
  });
  return jobcard?.cut_bag_types?.bag_type || "";
}

async function getSlittingPrintWastage(jobCardId: number) {
  const slittingWastage = await prisma.hps_slitting_wastage.findFirst({
    where: { job_card_id: jobCardId },
    select: { slitting_wastage: true },
  });
  const printWastage = await prisma.hps_print_wastage.findFirst({
    where: { job_card_id: jobCardId },
    select: { print_wastage: true },
  });
  return {
    slitting_wastage: slittingWastage?.slitting_wastage || "0",
    print_wastage: printWastage?.print_wastage || "0",
  };
}

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

    // Prefer cutting roll (existing path)
    const cuttingRoll = await prisma.hps_cutting_roll.findFirst({
      where: { cutting_barcode: barcode },
      select: {
        cutting_roll_id: true,
        no_of_bags: true,
        job_card_id: true,
        cutting_wastage: true,
        cutting_id: true,
      },
    });

    if (cuttingRoll) {
      const bag_type = await getJobCardBagType(cuttingRoll.job_card_id);

      // Keep legacy wastage tracing from cutting input barcode
      const cutting = await prisma.hps_cutting.findFirst({
        where: { cutting_id: cuttingRoll.cutting_id },
        select: { roll_barcode_no: true },
      });

      let slittingWastage = "0";
      let printWastage = "0";

      if (cutting?.roll_barcode_no) {
        const printPack = await prisma.hps_print_pack.findFirst({
          where: { print_barcode: cutting.roll_barcode_no },
          select: { print_id: true },
        });

        if (printPack?.print_id) {
          const print = await prisma.hps_print.findFirst({
            where: { print_id: printPack.print_id },
            select: { print_barcode_no: true },
          });

          if (print?.print_barcode_no) {
            const slittingRoll = await prisma.hps_slitting_roll.findFirst({
              where: { slitting_barcode: print.print_barcode_no },
              select: { slitting_id: true },
            });

            if (slittingRoll?.slitting_id) {
              const slittingWastageData =
                await prisma.hps_slitting_wastage.findFirst({
                  where: { slitting_id: slittingRoll.slitting_id },
                  select: { slitting_wastage: true },
                });
              slittingWastage = slittingWastageData?.slitting_wastage || "0";
            }
          }

          const printWastageData = await prisma.hps_print_wastage.findFirst({
            where: { print_id: printPack.print_id },
            select: { print_wastage: true },
          });
          printWastage = printWastageData?.print_wastage || "0";
        } else {
          const fallback = await getSlittingPrintWastage(cuttingRoll.job_card_id);
          slittingWastage = fallback.slitting_wastage;
          printWastage = fallback.print_wastage;
        }
      }

      return NextResponse.json({
        message: "Data fetched successfully",
        data: {
          no_of_bags: cuttingRoll.no_of_bags,
          bag_type,
          slitting_wastage: slittingWastage,
          print_wastage: printWastage,
          cutting_wastage: cuttingRoll.cutting_wastage || "0",
          sheeting_wastage: "0",
          source: "cutting",
          roll_id: cuttingRoll.cutting_roll_id,
        },
      });
    }

    // Fallback: sheeting roll
    const sheetingRoll = await prisma.hps_sheeting_roll.findFirst({
      where: { sheeting_barcode: barcode },
      select: {
        sheeting_roll_id: true,
        no_of_bags: true,
        job_card_id: true,
        sheeting_wastage: true,
      },
    });

    if (!sheetingRoll) {
      return NextResponse.json(
        { message: "Roll not found" },
        { status: 404 }
      );
    }

    const bag_type = await getJobCardBagType(sheetingRoll.job_card_id);
    const wastage = await getSlittingPrintWastage(sheetingRoll.job_card_id);

    return NextResponse.json({
      message: "Data fetched successfully",
      data: {
        no_of_bags: sheetingRoll.no_of_bags,
        bag_type,
        slitting_wastage: wastage.slitting_wastage,
        print_wastage: wastage.print_wastage,
        cutting_wastage: "0",
        sheeting_wastage: sheetingRoll.sheeting_wastage || "0",
        source: "sheeting",
        roll_id: sheetingRoll.sheeting_roll_id,
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Error fetching data", error: String(error) },
      { status: 500 }
    );
  }
}

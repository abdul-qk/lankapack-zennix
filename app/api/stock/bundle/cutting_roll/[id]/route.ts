import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const barcode = parseInt(params.id);

    if (!barcode) {
      return NextResponse.json(
        { message: "Missing barcode parameter" },
        { status: 400 }
      );
    }

    const cuttingRoll = await prisma.hps_cutting_roll.findFirst({
      where: {
        cutting_roll_id: barcode,
      },
      select: {
        no_of_bags: true,
        job_card_id: true,
        cutting_wastage: true,
        cutting_id: true,
      },
    });

    if (!cuttingRoll) {
      return NextResponse.json(
        { message: "Cutting roll not found" },
        { status: 404 }
      );
    }

    // Get associated job card with bag type
    const jobcard = await prisma.hps_jobcard.findUnique({
      where: {
        job_card_id: cuttingRoll.job_card_id,
      },
      select: {
        cut_bag_types: {
          select: {
            bag_type: true,
          },
        },
      },
    });

    // Get cutting details to trace back to print
    const cutting = await prisma.hps_cutting.findFirst({
      where: {
        cutting_id: cuttingRoll.cutting_id,
      },
      select: {
        roll_barcode_no: true,
      },
    });

    let slittingWastage = "0";
    let printWastage = "0";

    if (cutting?.roll_barcode_no) {
      // Try to find print pack first
      const printPack = await prisma.hps_print_pack.findFirst({
        where: {
          print_barcode: cutting.roll_barcode_no,
        },
        select: {
          print_id: true,
        },
      });

      if (printPack?.print_id) {
        // Get print barcode
        const print = await prisma.hps_print.findFirst({
          where: {
            print_id: printPack.print_id,
          },
          select: {
            print_barcode_no: true,
            print_wastage: true,
          },
        });
        // Get Print wastage data
        printWastage = print?.print_wastage || '0';

        if (print?.print_barcode_no) {
          // Get slitting roll
          const slittingRoll = await prisma.hps_slitting_roll.findFirst({
            where: {
              slitting_barcode: print.print_barcode_no,
            },
            select: {
              slitting_id: true,
            },
          });

          if (slittingRoll?.slitting_id) {
            // Get slitting wastage
            const slittingWastageData =
              await prisma.hps_slitting_wastage.findFirst({
                where: {
                  slitting_id: slittingRoll.slitting_id,
                },
                select: {
                  slitting_wastage: true,
                },
              });
            slittingWastage = slittingWastageData?.slitting_wastage || "0";
          }
        }
      } else {
        // Fallback: try to get slitting wastage by job_card_id
        const slitting_id = await prisma.hps_slitting_roll.findFirst({
          where: {
            slitting_barcode: cutting.roll_barcode_no,
          },
          select: {
            slitting_id: true,
          },
        });

        if (slitting_id?.slitting_id) {
          const slittingWastageData =
            await prisma.hps_slitting_wastage.findFirst({
              where: {
                slitting_id: slitting_id?.slitting_id,
              },
              select: {
                slitting_wastage: true,
              },
            });

          slittingWastage = slittingWastageData?.slitting_wastage || "0";
        }
      }
    }

    const data = {
      no_of_bags: cuttingRoll.no_of_bags,
      bag_type: jobcard?.cut_bag_types?.bag_type || "",
      slitting_wastage: slittingWastage,
      print_wastage: printWastage,
      cutting_wastage: cuttingRoll?.cutting_wastage || "0",
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
  }
}

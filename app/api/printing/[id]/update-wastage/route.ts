import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { print_id, balance_weight, balance_width, print_wastage } =
      await req.json();

    // Validate input
    if (!print_id) {
      return Response.json({ error: "Print ID is required" }, { status: 400 });
    }

    if (!balance_weight || !balance_width || !print_wastage) {
      return Response.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if the print record exists
    const printRecord = await prisma.hps_print.findFirst({
      where: {
        print_id: print_id,
        job_card_id: jobCardId,
      },
    });

    if (!printRecord) {
      return Response.json(
        { error: "Print record not found" },
        { status: 404 }
      );
    }

    // Update the print record
    const updatedPrint = await prisma.hps_print.update({
      where: {
        print_id: print_id,
      },
      data: {
        balance_weight: balance_weight.toString(),
        balance_width: balance_width.toString(),
        print_wastage: print_wastage.toString(),
        update_date: new Date(),
      },
    });

    // Add print wastage record
    const newPrintWastage = await prisma.hps_print_wastage.create({
      data: {
        job_card_id: jobCardId,
        print_id: print_id,
        print_wastage: print_wastage.toString(),
        add_date: new Date(),
        user_id: 1, // Replace with actual user ID from your auth system
        del_ind: 0, // Not deleted
      },
    });

    return Response.json(
      {
        success: true,
        message: "Print record updated and wastage added successfully",
        data: {
          updatedPrint,
          newPrintWastage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating print record and adding wastage:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (
        error.message.includes("invalid input syntax") ||
        error.message.includes("Cannot parse")
      ) {
        return Response.json(
          { error: "Invalid input format" },
          { status: 400 }
        );
      }
    }

    return Response.json(
      { error: "Failed to update print record and add wastage" },
      { status: 500 }
    );
  }
}

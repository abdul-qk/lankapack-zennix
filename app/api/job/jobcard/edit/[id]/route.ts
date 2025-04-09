import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);

    // Get the job card details
    const jobCard = await prisma.hps_jobcard.findUnique({
      where: { job_card_id: jobCardId },
    });

    if (!jobCard) {
      return new Response(JSON.stringify({ error: "Job card not found" }), {
        status: 404,
      });
    }

    // Get additional data needed for the form
    const customerInfo = await prisma.hps_customer.findMany({});
    const paperRolls = await prisma.hps_particular.findMany({});
    const printSizes = await prisma.hps_print_size.findMany({});
    const cuttingTypes = await prisma.hps_cutting_type.findMany({});
    const colors = await prisma.hps_colour.findMany({});

    // Get material items for the selected paper roll
    const materials = await prisma.hps_stock.findMany({
      where: {
        material_item_particular: jobCard.slitting_roll_type,
      },
      select: {
        item_gsm: true,
        material_item_size: true,
      },
      distinct: ["item_gsm", "material_item_size"],
    });

    return new Response(
      JSON.stringify({
        jobCard,
        customerInfo,
        paperRolls,
        printSizes,
        cuttingTypes,
        colors,
        materials,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching job card:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const {
      customer_id,
      paper_roll_id,
      gsm,
      size,
      job_card_date,
      delivery_date,
      unit_price,
      slitting,
      printing,
      cutting,
    } = await req.json();

    // Format dates properly
    const formattedUpdatedDate = new Date(); // Current date for updated_date

    // Update the job card with the appropriate fields
    const updatedJobCard = await prisma.hps_jobcard.update({
      where: { job_card_id: jobCardId },
      data: {
        customer_id: parseInt(customer_id),
        section_list: [
          slitting.active ? "1" : null,
          printing.active ? "2" : null,
          cutting.active ? "3" : null,
        ]
          .filter(Boolean)
          .join(","),
        unit_price: unit_price.toString(),
        slitting_roll_type: parseInt(paper_roll_id), // Maps to particular_id
        slitting_paper_gsm: gsm,
        slitting_paper_size: parseInt(size),
        slitting_size: slitting.active ? slitting.value : null,
        slitting_remark: slitting.active ? slitting.remark : "",

        // Printing data
        printing_size:
          printing.active && printing.cylinder_size
            ? parseInt(printing.cylinder_size)
            : 1,
        printing_color_type: printing.active ? printing.number_of_colors : null,
        printing_color_name:
          printing.active && printing.selected_colors
            ? [...printing.selected_colors, "0", "0", "0", "0"]
                .slice(0, 4)
                .join(",")
            : null,
        printing_no_of_bag: printing.active ? printing.number_of_bags : null,
        printing_remark: printing.active ? printing.remark : "",
        block_size:
          printing.active && printing.block_size ? printing.block_size : "",

        // Cutting data
        cutting_type:
          cutting.active && cutting.cutting_type
            ? parseInt(cutting.cutting_type)
            : 1,
        cutting_bags_select: cutting.active ? cutting.selected_type : null,
        cutting_bag_type:
          cutting.active && cutting.bag_type
            ? parseInt(cutting.bag_type)
            : 1,
        cutting_print_name: cutting.active ? cutting.print_name : null,
        cuting_no_of_bag: cutting.active ? cutting.number_of_bags : null,
        cuting_remark: cutting.active ? cutting.remark : "",
        cutting_fold: cutting.active && cutting.fold ? cutting.fold : "",

        // Dates
        updated_date: formattedUpdatedDate,
        delivery_date: delivery_date
          ? new Date(delivery_date).toISOString().split("T")[0]
          : "",
      },
    });

    return new Response(JSON.stringify(updatedJobCard), { status: 200 });
  } catch (error) {
    console.error("Error updating job card:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update job card",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
      }
    );
  }
}

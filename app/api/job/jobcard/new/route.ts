import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  //   Get all customers from hps_customer table
  try {
    const customerInfo = await prisma.hps_customer.findMany({});
    const paperRolls = await prisma.hps_particular.findMany({});
    const printSizes = await prisma.hps_print_size.findMany({});
    const cuttingTypes = await prisma.hps_cutting_type.findMany({});
    const colors = await prisma.hps_colour.findMany({});
    // const stock = await prisma.hps_stock.findMany({});

    return new Response(
      JSON.stringify({
        customerInfo,
        paperRolls,
        printSizes,
        cuttingTypes,
        colors,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching job card info:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
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

    console.log('Received job_card_date:', job_card_date);
    console.log('Received delivery_date:', delivery_date);

    // Parse date strings and create dates that preserve the day
    // Function to safely parse date string in MM/DD/YYYY format
    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      // Split the date string and extract components
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      
      const month = parseInt(parts[0], 10) - 1; // JS months are 0-indexed
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Create date in UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month, day, 12, 0, 0));
      console.log(`Parsed date: ${dateStr} -> ${date.toISOString()}`);
      return date;
    };
    
    const formattedAddDate = parseDate(job_card_date) || new Date();
    const formattedUpdatedDate = new Date(); // Current date for updated_date

    // Create the job card with the appropriate fields from the schema
    const newJobCard = await prisma.hps_jobcard.create({
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
            : 0, // Default value to avoid NULL, adjust as needed
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
            : 1, // Default value to avoid NULL
        cutting_bags_select: cutting.active ? cutting.selected_type : null,
        cutting_bag_type:
          cutting.active && cutting.bag_type ? parseInt(cutting.bag_type) : 1, // Default value
        cutting_print_name: cutting.active ? cutting.print_name : null,
        cuting_no_of_bag: cutting.active ? cutting.number_of_bags : null,
        cuting_remark: cutting.active ? cutting.remark : "",
        cutting_fold: cutting.active && cutting.fold ? cutting.fold : "",

        // Dates
        add_date: formattedAddDate,
        updated_date: formattedUpdatedDate,
        delivery_date: delivery_date
          ? (() => {
              const parsedDate = parseDate(delivery_date);
              return parsedDate ? parsedDate.toISOString().split("T")[0] : "";
            })()
          : "",

        // Status indicators
        user_id: 1, // Default user ID, modify as needed
        card_slitting: 0,
        card_printting: 0,
        card_cutting: 0,
        del_ind: 0, // Not deleted
      },
    });

    return new Response(JSON.stringify(newJobCard), { status: 201 });
  } catch (error) {
    console.error("Error adding new job card:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to add job card",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
      }
    );
  }
}

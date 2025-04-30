import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id, 10);
    if (isNaN(jobCardId)) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
      });
    }

    const printingInfo = await prisma.hps_jobcard.findFirst({
      include: {
        customer: true,
        particular: true,
        print_size: true,
      },
      where: {
        job_card_id: jobCardId,
        OR: [
          { section_list: "2" },
          { section_list: { startsWith: "2," } },
          { section_list: { endsWith: ",2" } },
          { section_list: { contains: ",2," } },
        ],
      },
    });

    if (!printingInfo) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    // Fetch all colors to map IDs to names
    const colors = await prisma.hps_colour.findMany();

    // Create a map of color IDs to color names
    const colorMap = colors.reduce((map, color) => {
      map[color.colour_id] = color.colour_name;
      return map;
    }, {} as Record<number, string>);

    // Process the color names if they exist
    let colorNames = "";
    if (printingInfo.printing_color_name) {
      // Split the CSV string into an array of IDs
      const colorIds = printingInfo.printing_color_name.split(",");

      // Map each ID to its name and filter out any zeros or invalid IDs
      const mappedColors = colorIds
        .map((id) => {
          const colorId = parseInt(id);
          return colorId > 0 ? colorMap[colorId] || `Unknown (${id})` : null;
        })
        .filter(Boolean); // Remove null values

      // Join the color names with commas
      colorNames = mappedColors.join(", ");
    }

    const printingData = await prisma.hps_print.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    const printingPackData = await prisma.hps_print_pack.findMany({
      where: {
        job_card_id: jobCardId,
      },
    });

    return new Response(
      JSON.stringify({
        ...printingInfo,
        formattedColorNames: colorNames,
        printingData,
        printingPackData,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching slitting info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

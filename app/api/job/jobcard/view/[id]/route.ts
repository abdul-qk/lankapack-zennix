import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const jobId = parseInt(params.id, 10);

  if (isNaN(jobId)) {
    return new Response(JSON.stringify({ error: "Invalid Material ID" }), {
      status: 400,
    });
  }

  try {
    // Fetch the job card with customer info
    const jobCardInfo = await prisma.hps_jobcard.findUnique({
      where: { job_card_id: jobId },
    });

    if (!jobCardInfo) {
      return new Response(JSON.stringify({ error: "Job card not found" }), {
        status: 404,
      });
    }

    // Conditionally include print_size based on printing_size value
    const includeOptions: any = {
      customer: true,
    };

    if (jobCardInfo.printing_size !== 0) {
      includeOptions.print_size = true;
    }

    // Re-fetch with conditional includes
    const finalJobCardInfo = await prisma.hps_jobcard.findUnique({
      where: { job_card_id: jobId },
      include: includeOptions,
    });
    const printSizes = await prisma.hps_print_size.findMany({});
    const cuttingTypes = await prisma.hps_cutting_type.findMany({});

    if (!finalJobCardInfo) {
      return new Response(JSON.stringify({ error: "Job card not found" }), {
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
    if (finalJobCardInfo.printing_color_name) {
      // Split the CSV string into an array of IDs
      const colorIds = finalJobCardInfo.printing_color_name.split(",");

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

    // Add the formatted color names to the response
    const responseData = {
      ...finalJobCardInfo,
      formattedColorNames: colorNames,
      printSizes,
      cuttingTypes,
    };

    return new Response(JSON.stringify(responseData), { status: 200 });
  } catch (error) {
    console.error("Error fetching job card info:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

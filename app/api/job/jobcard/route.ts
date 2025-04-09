import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const materialInfo = await prisma.hps_jobcard.findMany({
      include: {
        customer: true,
      },
    });

    return new Response(JSON.stringify({ data: materialInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching material info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    // Validate input
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Job card ID is required" }),
        {
          status: 400,
        }
      );
    }

    // Convert id to integer if needed
    const jobCardId = parseInt(id);

    // Delete the job card
    const deletedJobCard = await prisma.hps_jobcard.delete({
      where: {
        job_card_id: jobCardId,
      },
    });

    return new Response(
      JSON.stringify({
        message: "Job card deleted successfully",
        deletedJobCard,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting job card:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete job card",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
      }
    );
  }
}

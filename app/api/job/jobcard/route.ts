import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const materialInfo = await prisma.hps_jobcard.findMany({
      include: {
        customer: true,
        cut_bag_types: {
          select: {
            bag_type: true,
          },
        },
      },
      orderBy: {
        job_card_id: "asc",
      },
    });

    const sheetTypes = await prisma.hps_sheet_type.findMany();
    const sheetTypeMap = new Map(
      sheetTypes.map((st) => [st.sheet_id.toString(), st.sheet_type])
    );

    const data = materialInfo.map((item) => ({
      ...item,
      sheetTypeName: item.sheeting_barcode
        ? sheetTypeMap.get(item.sheeting_barcode) || null
        : null,
    }));

    return new Response(JSON.stringify({ data }), {
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
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

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
      JSON.stringify({ error: "Failed to delete job card" }),
      {
        status: 500,
      }
    );
  }
}

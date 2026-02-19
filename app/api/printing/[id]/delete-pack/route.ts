import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobCardId = parseInt(params.id);
    const { pack_id } = await req.json();

    // Validate input
    if (!pack_id) {
      return Response.json({ error: "Pack ID is required" }, { status: 400 });
    }

    // Check if the print pack record exists
    const printPackRecord = await prisma.hps_print_pack.findFirst({
      where: {
        pack_id: pack_id,
        job_card_id: jobCardId,
      },
    });

    if (!printPackRecord) {
      return Response.json(
        { error: "Print pack record not found" },
        { status: 404 }
      );
    }

    // Delete the print pack record
    await prisma.hps_print_pack.delete({
      where: {
        pack_id: pack_id,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Print pack record deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting print pack record:", error);

    return Response.json(
      { error: "Failed to delete print pack record" },
      { status: 500 }
    );
  }
}

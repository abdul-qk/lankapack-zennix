import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const bundleInfo = await prisma.hps_bundle_info.findMany({
      include: {
        cutting_roll: true
      },
    });

    return new Response(JSON.stringify({ data: bundleInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching bundles info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { colour_name } = await req.json();

    if (!colour_name || colour_name.trim() === "") {
      return new Response(JSON.stringify({ error: "Color is required" }), {
        status: 400,
      });
    }

    const newColor = await prisma.hps_colour.create({
      data: { colour_name },
    });

    return new Response(JSON.stringify(newColor), { status: 201 });
  } catch (error) {
    console.error("Error adding new color:", error);
    return new Response(JSON.stringify({ error: "Failed to add color" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, colour_name } = await req.json();

    if (!id || colour_name === undefined) {
      return new Response(
        JSON.stringify({ error: "ID and colour_name are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_colour.update({
      where: { colour_id: id },
      data: { colour_name: colour_name },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating colour name:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update colour name" }),
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID is required to delete" }),
        { status: 400 }
      );
    }

    await prisma.hps_colour.delete({
      where: { colour_id: id },
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting colour:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

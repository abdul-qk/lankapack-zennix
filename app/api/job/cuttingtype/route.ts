import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const rollInfo = await prisma.hps_cutting_type.findMany({});

    return new Response(JSON.stringify({ data: rollInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching cutting type info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { cutting_type } = await req.json();

    if (!cutting_type || cutting_type.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Particular name is required" }),
        { status: 400 }
      );
    }

    const newRoll = await prisma.hps_cutting_type.create({
      data: { cutting_type },
    });

    return new Response(JSON.stringify(newRoll), { status: 201 });
  } catch (error) {
    console.error("Error adding new cutting type:", error);
    return new Response(JSON.stringify({ error: "Failed to add roll type" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  console.log("PATCH function called"); // Add this logging
  console.log("Request method:", req.method); // And this
  console.log("Request URL:", req.url);
  try {
    const { id, cutting_type } = await req.json();

    if (!id || cutting_type === undefined) {
      return new Response(
        JSON.stringify({ error: "ID and Cutting Type are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_cutting_type.update({
      where: { cutting_id: id },
      data: { cutting_type: cutting_type },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating cutting type:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update cutting type" }),
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

    await prisma.hps_cutting_type.delete({
      where: { cutting_id: id },
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting cutting type:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

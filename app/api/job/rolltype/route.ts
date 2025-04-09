import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const rollInfo = await prisma.hps_roll_type.findMany({});

    return new Response(JSON.stringify({ data: rollInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching roll type info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { roll_type } = await req.json();

    if (!roll_type || roll_type.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Particular name is required" }),
        { status: 400 }
      );
    }

    const newRoll = await prisma.hps_roll_type.create({
      data: { roll_type },
    });

    return new Response(JSON.stringify(newRoll), { status: 201 });
  } catch (error) {
    console.error("Error adding new roll type:", error);
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
    const { id, roll_type } = await req.json();

    if (!id || roll_type === undefined) {
      return new Response(
        JSON.stringify({ error: "ID and Roll Type are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_roll_type.update({
      where: { roll_id: id },
      data: { roll_type: roll_type },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating roll type:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update roll type" }),
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

    await prisma.hps_roll_type.delete({
      where: { roll_id: id },
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting roll type:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

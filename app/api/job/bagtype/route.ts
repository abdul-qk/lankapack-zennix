import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const bagInfo = await prisma.hps_bag_type.findMany({});

    return new Response(JSON.stringify({ data: bagInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching bag type info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { bag_type, bags_select, bag_price } = await req.json();

    if (!bag_type || bag_type.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Particular name is required" }),
        { status: 400 }
      );
    }

    const newBag = await prisma.hps_bag_type.create({
      data: { bags_select, bag_type, bag_price },
    });

    return new Response(JSON.stringify(newBag), { status: 201 });
  } catch (error) {
    console.error("Error adding new bag type:", error);
    return new Response(JSON.stringify({ error: "Failed to add bag type" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  console.log("PATCH function called"); // Add this logging
  console.log("Request method:", req.method); // And this
  console.log("Request URL:", req.url);
  try {
    const { id, bag_type, bags_select, bag_price } = await req.json();

    if (
      !id ||
      bag_type === undefined ||
      bags_select === undefined ||
      bag_price === undefined
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_bag_type.update({
      where: { bag_id: id },
      data: {
        bag_type: bag_type,
        bags_select: bags_select,
        bag_price: bag_price,
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating bag type:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update bag type" }),
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

    await prisma.hps_bag_type.delete({
      where: { bag_id: id },
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting bag type:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

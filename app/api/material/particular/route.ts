import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { search } = Object.fromEntries(new URL(req.url).searchParams);

    // Build the search filter for all relevant columns
    const searchFilter = search
      ? {
          OR: [
            { particular_name: { contains: search, mode: "insensitive" } },
            { particular_status: { equals: parseInt(search, 10) || 0 } },
          ],
        }
      : {};

    // Fetch all filtered particular entries
    const particulars = await prisma.hps_particular.findMany({
      where: searchFilter,
    });

    return new Response(JSON.stringify({ data: particulars }), { status: 200 });
  } catch (error) {
    console.error("Error fetching particulars:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { particular_name } = await req.json();

    if (!particular_name || particular_name.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Particular name is required" }),
        { status: 400 }
      );
    }

    const newParticular = await prisma.hps_particular.create({
      data: { particular_name, particular_status: 1, added_date: new Date() },
    });

    return new Response(JSON.stringify(newParticular), { status: 201 });
  } catch (error) {
    console.error("Error adding new particular:", error);
    return new Response(JSON.stringify({ error: "Failed to add particular" }), {
      status: 500,
    });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, particular_name } = await req.json();

    if (!id || !particular_name) {
      return new Response(
        JSON.stringify({ error: "ID and particular name are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_particular.update({
      where: { particular_id: id },
      data: { particular_name },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating particular:", error);
    return new Response(JSON.stringify({ error: "Failed to update data" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || status === undefined) {
      return new Response(
        JSON.stringify({ error: "ID and status are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_particular.update({
      where: { particular_id: id },
      data: { particular_status: status },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error toggling status:", error);
    return new Response(JSON.stringify({ error: "Failed to update status" }), {
      status: 500,
    });
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

    await prisma.hps_particular.delete({
      where: { particular_id: id },
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting particular:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

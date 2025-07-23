import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data
    const printInfo = await prisma.hps_print_size.findMany({});

    return new Response(JSON.stringify({ data: printInfo }), {
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
    const { print_size } = await req.json();

    if (!print_size || print_size.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Print Size is required" }),
        { status: 400 }
      );
    }

    const newSize = await prisma.hps_print_size.create({
      data: { print_size },
    });

    return new Response(JSON.stringify(newSize), { status: 201 });
  } catch (error) {
    console.error("Error adding new print size:", error);
    return new Response(JSON.stringify({ error: "Failed to add print size" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, print_size } = await req.json();

    if (!id || print_size === undefined) {
      return new Response(
        JSON.stringify({ error: "ID and print_size are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_print_size.update({
      where: { print_size_id: id },
      data: { print_size: print_size },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating print size:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update print size" }),
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

    await prisma.hps_print_size.delete({
      where: { print_size_id: id },
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

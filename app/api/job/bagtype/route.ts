import { prisma } from "@/lib/prisma";

const BAG_TYPE_MAX_LENGTH = 120;
const BAG_PRICE_MAX_LENGTH = 12;

function validateBagTypeFields(bag_type: string, bag_price: string) {
  const trimmedType = bag_type.trim();
  const trimmedPrice = bag_price.trim();

  if (!trimmedType) {
    return { error: "Bag type name is required" };
  }

  if (trimmedType.length > BAG_TYPE_MAX_LENGTH) {
    return {
      error: `Bag type name must be ${BAG_TYPE_MAX_LENGTH} characters or fewer (currently ${trimmedType.length})`,
    };
  }

  if (trimmedPrice.length > BAG_PRICE_MAX_LENGTH) {
    return {
      error: `Bag price must be ${BAG_PRICE_MAX_LENGTH} characters or fewer (currently ${trimmedPrice.length})`,
    };
  }

  return {
    bag_type: trimmedType,
    bag_price: trimmedPrice,
  };
}

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

    const validated = validateBagTypeFields(bag_type, bag_price ?? "");
    if ("error" in validated) {
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 400,
      });
    }

    const newBag = await prisma.hps_bag_type.create({
      data: {
        bags_select,
        bag_type: validated.bag_type,
        bag_price: validated.bag_price,
      },
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

    const validated = validateBagTypeFields(bag_type, bag_price);
    if ("error" in validated) {
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 400,
      });
    }

    const updated = await prisma.hps_bag_type.update({
      where: { bag_id: id },
      data: {
        bag_type: validated.bag_type,
        bags_select: bags_select,
        bag_price: validated.bag_price,
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

import { prisma } from "@/lib/prisma";

const SHEET_TYPE_MAX_LENGTH = 120;
const SHEET_PRICE_MAX_LENGTH = 12;

function validateSheetTypeFields(sheet_type: string, sheet_price: string) {
  const trimmedType = sheet_type.trim();
  const trimmedPrice = sheet_price.trim();

  if (!trimmedType) {
    return { error: "Sheet type name is required" };
  }

  if (trimmedType.length > SHEET_TYPE_MAX_LENGTH) {
    return {
      error: `Sheet type name must be ${SHEET_TYPE_MAX_LENGTH} characters or fewer (currently ${trimmedType.length})`,
    };
  }

  if (trimmedPrice.length > SHEET_PRICE_MAX_LENGTH) {
    return {
      error: `Sheet price must be ${SHEET_PRICE_MAX_LENGTH} characters or fewer (currently ${trimmedPrice.length})`,
    };
  }

  return {
    sheet_type: trimmedType,
    sheet_price: trimmedPrice,
  };
}

export async function GET() {
  try {
    const sheetInfo = await prisma.hps_sheet_type.findMany({
      orderBy: { sheet_id: "asc" },
    });

    return new Response(JSON.stringify({ data: sheetInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching sheet type info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { sheet_type, sheet_price } = await req.json();

    const validated = validateSheetTypeFields(sheet_type ?? "", sheet_price ?? "");
    if ("error" in validated) {
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 400,
      });
    }

    const newSheet = await prisma.hps_sheet_type.create({
      data: {
        sheet_type: validated.sheet_type,
        sheet_price: validated.sheet_price || "0",
      },
    });

    return new Response(JSON.stringify(newSheet), { status: 201 });
  } catch (error) {
    console.error("Error adding new sheet type:", error);
    return new Response(JSON.stringify({ error: "Failed to add sheet type" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, sheet_type, sheet_price } = await req.json();

    if (!id || sheet_type === undefined || sheet_price === undefined) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400 }
      );
    }

    const validated = validateSheetTypeFields(sheet_type, sheet_price);
    if ("error" in validated) {
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 400,
      });
    }

    const updated = await prisma.hps_sheet_type.update({
      where: { sheet_id: id },
      data: {
        sheet_type: validated.sheet_type,
        sheet_price: validated.sheet_price,
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating sheet type:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update sheet type" }),
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

    await prisma.hps_sheet_type.delete({
      where: { sheet_id: id },
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting sheet type:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

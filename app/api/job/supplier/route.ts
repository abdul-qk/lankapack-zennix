import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const supplierInfo = await prisma.hps_supplier.findMany({});

    return new Response(JSON.stringify({ data: supplierInfo }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching customer info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const {
      supplier_name,
      supplier_company,
      supplier_address,
      supplier_contact_no,
      supplier_email,
    } = await req.json();

    if (
      !supplier_name ||
      supplier_name.trim() === "" ||
      !supplier_company ||
      supplier_company.trim() === "" ||
      !supplier_address ||
      supplier_address.trim() === "" ||
      !supplier_contact_no ||
      supplier_contact_no.trim() === "" ||
      !supplier_email ||
      supplier_email.trim() === ""
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
        }
      );
    }

    const newColor = await prisma.hps_supplier.create({
      data: {
        supplier_name,
        supplier_company,
        supplier_address,
        supplier_contact_no,
        supplier_email,
      },
    });

    return new Response(JSON.stringify(newColor), { status: 201 });
  } catch (error) {
    console.error("Error adding new supplier:", error);
    return new Response(JSON.stringify({ error: "Failed to add color" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const {
      id,
      supplier_name,
      supplier_company,
      supplier_address,
      supplier_contact_no,
      supplier_email,
    } = await req.json();

    if (
      !id ||
      supplier_name === undefined ||
      supplier_company === undefined ||
      supplier_address === undefined ||
      supplier_contact_no === undefined ||
      supplier_email === undefined
    ) {
      return new Response(
        JSON.stringify({ error: "ID and colour_name are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_supplier.update({
      where: { supplier_id: id },
      data: {
        supplier_name,
        supplier_company,
        supplier_address,
        supplier_contact_no,
        supplier_email,
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating supplier details:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update supplier details" }),
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

    await prisma.hps_supplier.delete({
      where: { supplier_id: id },
    });

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

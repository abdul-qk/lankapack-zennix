import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const customerInfo = await prisma.hps_customer.findMany({});

    return new Response(JSON.stringify({ data: customerInfo }), {
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
      customer_full_name,
      contact_person,
      customer_address,
      customer_tel,
      customer_mobile,
      customer_email_address,
    } = await req.json();

    if (
      !customer_full_name ||
      customer_full_name.trim() === "" ||
      !contact_person ||
      contact_person.trim() === "" ||
      !customer_address ||
      customer_address.trim() === "" ||
      !customer_tel ||
      customer_tel.trim() === "" ||
      !customer_mobile ||
      customer_mobile.trim() === "" ||
      !customer_email_address ||
      customer_email_address.trim() === ""
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
        }
      );
    }

    const newColor = await prisma.hps_customer.create({
      data: {
        customer_full_name,
        contact_person,
        customer_address,
        customer_tel,
        customer_mobile,
        customer_add_date: new Date(),
        customer_email_address,
        hps_user_id: 0,
        del_ind: 0,
      },
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
    const {
      id,
      customer_full_name,
      contact_person,
      customer_address,
      customer_tel,
      customer_mobile,
      customer_email_address,
    } = await req.json();

    if (
      !id ||
      customer_full_name === undefined ||
      contact_person === undefined ||
      customer_address === undefined ||
      customer_tel === undefined ||
      customer_mobile === undefined ||
      customer_email_address === undefined
    ) {
      return new Response(
        JSON.stringify({ error: "ID and colour_name are required" }),
        { status: 400 }
      );
    }

    const updated = await prisma.hps_customer.update({
      where: { customer_id: id },
      data: {
        customer_full_name,
        contact_person,
        customer_address,
        customer_tel,
        customer_mobile,
        customer_email_address,
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Error updating cutsomer details:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update cutsomer details" }),
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

    await prisma.hps_customer.delete({
      where: { customer_id: id },
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

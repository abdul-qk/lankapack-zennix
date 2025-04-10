import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all bill info records that aren't deleted (del_ind = 0)
    const billInfo = await prisma.hps_bill_info.findMany({
      where: {
        del_ind: 1,
      },
      orderBy: {
        bill_info_id: "asc", // Most recent first
      },
    });

    // Get customer IDs from the bill info records
    const customerIds = billInfo.map((info) => info.customer_name); // In schema, customer_name is the customer ID

    // Fetch customer data in a single query
    const customers = await prisma.hps_customer.findMany({
      where: {
        customer_id: {
          in: customerIds,
        },
      },
      select: {
        customer_id: true,
        customer_full_name: true,
      },
    });

    // Create a lookup map for customer names
    const customerMap: Record<number, string> = {};
    customers.forEach((customer) => {
      customerMap[customer.customer_id] = customer.customer_full_name;
    });

    // Map to include the customer name directly
    const formattedData = billInfo.map((info) => ({
      bill_info_id: info.bill_info_id,
      customer_name: customerMap[info.customer_name] || "Unknown",
      bill_do: info.bill_do,
      bill_total: info.bill_total,
      add_date: info.add_date,
      customer_id: info.customer_name, // This is the ID reference
      user_id: info.user_id,
      del_ind: info.del_ind,
    }));

    return new Response(JSON.stringify({ data: formattedData }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching bill info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.customerId || !body.doNumber || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: customerId, doNumber, or items",
        }),
        { status: 400 }
      );
    }

    // Calculate total from items
    const total = body.items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.total || "0"),
      0
    );

    // Get customer information
    const customer = await prisma.hps_customer.findUnique({
      where: { customer_id: body.customerId },
      select: {
        customer_full_name: true,
        customer_address: true,
        customer_mobile: true,
      },
    });

    if (!customer) {
      return new Response(
        JSON.stringify({ error: "Customer not found" }),
        { status: 404 }
      );
    }

    // Create invoice record
    const invoiceInfo = await prisma.hps_bill_info.create({
      data: {
        customer_name: body.customerId,
        bill_do: body.doNumber,
        bill_total: total.toFixed(2),
        add_date: new Date(),
        user_id: body.userId || 1, // Default to 1 if not provided
        del_ind: 1, // Not deleted
      },
    });

    // Create invoice items
    const invoiceItemPromises = body.items.map((item: any) =>
      prisma.hps_bill_item.create({
        data: {
          bill_info_id: invoiceInfo.bill_info_id,
          de_number: parseInt(body.doId), // Sales info ID
          bundel_type: parseInt(item.bagTypeId),
          bundel_qty: item.quantity.toString(),
          item_price: item.price,
          item_total: item.total,
          user_id: body.userId || 1, // Default to 1 if not provided
          del_ind: 1, // Not deleted
        },
      })
    );

    const invoiceItems = await Promise.all(invoiceItemPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invoice created successfully",
        data: {
          invoiceInfo,
          invoiceItems,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create invoice" }),
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
      });
    }

    // Soft delete by setting del_ind to 1
    const updatedRecord = await prisma.hps_bill_info.update({
      where: {
        bill_info_id: parseInt(id),
      },
      data: {
        del_ind: 0,
      },
    });

    if (!updatedRecord) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invoice successfully deleted",
      }),
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error deleting bill info:", error);

    // Check if it's a Prisma error
    if (error.code === "P2025") {
      return new Response(
        JSON.stringify({
          error: "Record not found",
        }),
        {
          status: 404,
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to delete invoice",
        details: error.message,
      }),
      {
        status: 500,
      }
    );
  }
}

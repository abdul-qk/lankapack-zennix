import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch all sales info records that aren't deleted (del_ind = 0)
    const salesInfo = await prisma.hps_sales_info.findMany({
      where: {
        del_ind: 1,
      },
      orderBy: {
        sales_info_id: "asc", // Most recent first
      },
    });

    // Get customer IDs from the sales info records
    const customerIds = salesInfo.map((info) => info.customer_name); // In schema, customer_name is the customer ID

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
    const formattedData = salesInfo.map((info) => ({
      sales_info_id: info.sales_info_id,
      customer_name: customerMap[info.customer_name] || "Unknown",
      sales_no_bags: info.sales_no_bags,
      add_date: info.add_date,
      customer_id: info.customer_name, // This is the ID reference
      user_id: info.user_id,
      del_ind: info.del_ind,
    }));

    return new Response(JSON.stringify({ data: formattedData }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching sales info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
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
    const updatedRecord = await prisma.hps_sales_info.update({
      where: {
        sales_info_id: parseInt(id),
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
        message: "Delivery order successfully deleted",
      }),
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error deleting sales info:", error);

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
        error: "Failed to delete delivery order",
        details: error.message,
      }),
      {
        status: 500,
      }
    );
  }
}

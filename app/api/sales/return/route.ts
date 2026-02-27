import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    // Fetch all return info records that aren't deleted (del_ind = 0)
    const returnInfo = await prisma.hps_return_info.findMany({
      where: {
        del_ind: 1,
      },
      orderBy: {
        return_info_id: "asc",
      },
    });

    // Get customer IDs from the return info records
    const customerIds = returnInfo.map((info) => info.customer_name); // In your schema, customer_name is the customer ID

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
    const formattedData = returnInfo.map((info) => ({
      return_info_id: info.return_info_id,
      customer_name: customerMap[info.customer_name] || "Unknown", // Use customer_name from the map
      return_no_bags: info.return_no_bags,
      add_date: info.add_date,
      customer_id: info.customer_name, // This is the ID reference
      user_id: info.user_id,
      del_ind: info.del_ind,
    }));

    return new Response(JSON.stringify({ data: formattedData }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching return info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}

// Delete handler
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
    await prisma.hps_return_info.update({
      where: { return_info_id: parseInt(id) },
      data: { del_ind: 0 },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting return info:", error);
    return new Response(JSON.stringify({ error: "Failed to delete data" }), {
      status: 500,
    });
  }
}

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const returnId = parseInt(params.id);

    if (isNaN(returnId)) {
      return new Response(JSON.stringify({ error: "Invalid ID format" }), {
        status: 400,
      });
    }

    // Fetch the return info
    const returnInfo = await prisma.hps_return_info.findUnique({
      where: {
        return_info_id: returnId,
        del_ind: 1, // Only non-deleted records
      },
    });

    if (!returnInfo) {
      return new Response(JSON.stringify({ error: "Return record not found" }), {
        status: 404,
      });
    }

    // Fetch the customer information
    const customer = await prisma.hps_customer.findUnique({
      where: {
        customer_id: returnInfo.customer_name,
      },
      select: {
        customer_id: true,
        customer_full_name: true,
        customer_address: true,
        customer_mobile: true,
      },
    });

    // Fetch all return items for this return
    const returnItems = await prisma.hps_return_item.findMany({
      where: {
        return_info_id: returnId,
      },
      orderBy: {
        return_item_id: "asc",
      },
    });

    // Calculate total amount
    const totalAmount = returnItems.reduce((sum, item) => {
      return sum + parseFloat(item.item_total || "0");
    }, 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          returnInfo,
          customer,
          returnItems,
          totalAmount: totalAmount.toFixed(2),
        },
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching return details:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch return details" }),
      {
        status: 500,
      }
    );
  }
}

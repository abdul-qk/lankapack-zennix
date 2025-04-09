import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

// GET: Fetch customers for dropdown
export async function GET() {
  try {
    const customers = await prisma.hps_customer.findMany({
      where: {
        del_ind: 1,
      },
      select: {
        customer_id: true,
        customer_full_name: true,
      },
      orderBy: {
        customer_full_name: "asc",
      },
    });

    return new Response(JSON.stringify({ success: true, data: customers }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch customers" }), {
      status: 500,
    });
  }
}

// POST: Create a new return note
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, items, totalBags } = body;

    if (!customerId) {
      return new Response(JSON.stringify({ error: "Customer is required" }), {
        status: 400,
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one item is required" }),
        { status: 400 }
      );
    }

    // Get customer details for the return info
    const customer = await prisma.hps_customer.findUnique({
      where: {
        customer_id: customerId,
      },
      select: {
        customer_address: true,
        customer_mobile: true,
      },
    });

    if (!customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
      });
    }

    // Create return info record
    const returnInfo = await prisma.hps_return_info.create({
      data: {
        customer_name: customerId,
        customer_address: customer.customer_address || "",
        customer_contact: customer.customer_mobile || "",
        return_no_bags: totalBags.toString(),
        add_date: new Date(),
        user_id: 1, // Replace with actual user ID from session
        del_ind: 0,
      },
    });

    // Create return items
    const returnItems = await Promise.all(
      items.map((item: any) =>
        prisma.hps_return_item.create({
          data: {
            return_info_id: returnInfo.return_info_id,
            complete_item_id: item.complete_item_id || 0,
            barcode_no: item.barcode,
            bundle_type: item.bagType,
            n_weight: parseFloat(item.weight),
            no_of_bags: parseInt(item.bags),
            item_price: item.price.toString(),
            item_total: item.total.toString(),
            user_id: 1, // Replace with actual user ID from session
            return_status: 0,
          },
        })
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          returnInfoId: returnInfo.return_info_id,
          items: returnItems,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating return note:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create return note" }),
      { status: 500 }
    );
  }
}

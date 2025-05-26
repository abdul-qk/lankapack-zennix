import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

// PUT: Update an existing delivery order
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { customerId, items, totalBags } = body;
    const salesInfoId = parseInt(params.id);

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

    // Check if delivery order exists
    const existingDO = await prisma.hps_sales_info.findUnique({
      where: {
        sales_info_id: salesInfoId,
      },
    });

    if (!existingDO) {
      return new Response(
        JSON.stringify({ error: "Delivery order not found" }),
        { status: 404 }
      );
    }

    // Get customer details for the delivery order info
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

    // Update delivery order info record
    const updatedDO = await prisma.hps_sales_info.update({
      where: {
        sales_info_id: salesInfoId,
      },
      data: {
        customer_name: customerId,
        customer_address: customer.customer_address || "0",
        customer_contact: customer.customer_mobile || "0",
        sales_no_bags: totalBags.toString(),
        // Don't update add_date as we want to keep the original creation date
        user_id: 1, // Replace with actual user ID from session
      },
    });

    // Get existing items to determine what to delete
    const existingItems = await prisma.hps_sales_item.findMany({
      where: {
        sales_info_id: salesInfoId,
      },
      select: {
        sales_item_id: true,
      },
    });

    // Identify items that have sales_item_id (existing items)
    const itemsWithIds = items
      .filter((item: any) => item.sales_item_id)
      .map((item: any) => item.sales_item_id);

    // Find items to be deleted (items in DB that are not in the updated list)
    const itemsToDelete = existingItems
      .filter((item) => !itemsWithIds.includes(item.sales_item_id))
      .map((item) => item.sales_item_id);

    // Delete removed items
    if (itemsToDelete.length > 0) {
      await prisma.hps_sales_item.deleteMany({
        where: {
          sales_item_id: {
            in: itemsToDelete,
          },
        },
      });
    }

    // Process items: update existing ones and create new ones
    const processedItems = await Promise.all(
      items.map(async (item: any) => {
        const itemData = {
          sales_info_id: salesInfoId,
          complete_item_id: item.complete_item_id || 0,
          barcode_no: item.barcode,
          bundle_type: item.bagType,
          n_weight: parseFloat(item.weight.toString()),
          no_of_bags: parseInt(item.bags.toString()),
          item_price: item.price.toString(),
          item_total: item.total.toString(),
          user_id: 1, // Replace with actual user ID from session
          sales_status: 0,
        };

        // If item has sales_item_id, update it; otherwise create new
        if (item.sales_item_id) {
          return prisma.hps_sales_item.update({
            where: {
              sales_item_id: item.sales_item_id,
            },
            data: itemData,
          });
        } else {
          return prisma.hps_sales_item.create({
            data: itemData,
          });
        }
      })
    );

    // Update del_ind for complete items
    await Promise.all(
      items.map((item: any) =>
        prisma.hps_complete_item.update({
          where: {
            complete_item_id: item.complete_item_id,
          },
          data: {
            del_ind: 0,
          },
        })
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          salesInfoId: updatedDO.sales_info_id,
          items: processedItems,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating delivery order:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update delivery order" }),
      { status: 500 }
    );
  }
}

// GET: Get details of a delivery order for editing
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salesInfoId = parseInt(params.id);

    // Get delivery order info with related items
    const deliveryOrderInfo = await prisma.hps_sales_info.findUnique({
      where: {
        sales_info_id: salesInfoId,
      },
      select: {
        sales_info_id: true,
        customer_name: true,
        customer_address: true,
        customer_contact: true,
        sales_no_bags: true,
        add_date: true,
      },
    });

    if (!deliveryOrderInfo) {
      return new Response(
        JSON.stringify({ error: "Delivery order not found" }),
        { status: 404 }
      );
    }

    // Get delivery order items
    const deliveryOrderItems = await prisma.hps_sales_item.findMany({
      where: {
        sales_info_id: salesInfoId,
      },
    });

    // Combine data for response
    const result = {
      ...deliveryOrderInfo,
      items: deliveryOrderItems,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching delivery order details:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch delivery order details" }),
      { status: 500 }
    );
  }
}

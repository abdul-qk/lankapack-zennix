import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const returnId = parseInt(params.id);
    const body = await req.json();
    const { customerId, items, totalBags } = body;

    if (isNaN(returnId)) {
      return new Response(JSON.stringify({ error: "Invalid ID format" }), {
        status: 400,
      });
    }

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

    // Check if return exists
    const existingReturn = await prisma.hps_return_info.findUnique({
      where: {
        return_info_id: returnId,
        del_ind: 1,
      },
    });

    if (!existingReturn) {
      return new Response(JSON.stringify({ error: "Return not found" }), {
        status: 404,
      });
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

    // Update return info record
    const updatedReturnInfo = await prisma.hps_return_info.update({
      where: {
        return_info_id: returnId,
      },
      data: {
        customer_name: customerId,
        customer_address: customer.customer_address || "",
        customer_contact: customer.customer_mobile || "",
        return_no_bags: totalBags.toString(),
        // Don't update add_date to preserve original creation date
        user_id: 1, // Replace with actual user ID from session
      },
    });

    // Get existing return items
    const existingItems = await prisma.hps_return_item.findMany({
      where: {
        return_info_id: returnId,
      },
      select: {
        return_item_id: true,
        barcode_no: true,
      },
    });

    // Create a map of existing items by barcode for easy lookup
    const existingItemMap = new Map(
      existingItems.map(item => [item.barcode_no, item.return_item_id])
    );

    // Process each item - update existing ones and create new ones
    const processedItems = await Promise.all(
      items.map(async (item: any) => {
        const existingItemId = existingItemMap.get(item.barcode);
        
        if (existingItemId) {
          // Update existing item
          return prisma.hps_return_item.update({
            where: {
              return_item_id: existingItemId,
            },
            data: {
              bundle_type: item.bagType,
              n_weight: parseFloat(item.weight),
              no_of_bags: parseInt(item.bags),
              item_price: item.price.toString(),
              item_total: item.total.toString(),
              user_id: 1, // Replace with actual user ID from session
            },
          });
        } else {
          // Create new item
          return prisma.hps_return_item.create({
            data: {
              return_info_id: returnId,
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
          });
        }
      })
    );

    // Find items to delete (items that were in the database but not in the updated list)
    const updatedBarcodes = new Set(items.map((item: any) => item.barcode));
    const itemsToDelete = existingItems.filter(
      item => !updatedBarcodes.has(item.barcode_no)
    );

    // Delete items that are no longer in the list
    if (itemsToDelete.length > 0) {
      await prisma.hps_return_item.deleteMany({
        where: {
          return_item_id: {
            in: itemsToDelete.map(item => item.return_item_id),
          },
        },
      });
    }

    // Update hps_complete_item table to mark returned items as deleted (del_ind = 1)
    const completeItemIds = items
      .map((item: any) => item.complete_item_id)
      .filter((id: number) => id && id > 0); // Filter out invalid IDs

    if (completeItemIds.length > 0) {
      await prisma.hps_complete_item.updateMany({
        where: {
          complete_item_id: {
            in: completeItemIds,
          },
        },
        data: {
          del_ind: 1,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          returnInfoId: updatedReturnInfo.return_info_id,
          items: processedItems,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating return note:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update return note" }),
      { status: 500 }
    );
  }
}

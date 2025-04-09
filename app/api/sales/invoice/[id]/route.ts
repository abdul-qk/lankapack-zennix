import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = parseInt(params.id);

    if (isNaN(invoiceId)) {
      return new Response(JSON.stringify({ error: "Invalid ID format" }), {
        status: 400,
      });
    }

    // Fetch the invoice info
    const invoiceInfo = await prisma.hps_bill_info.findUnique({
      where: {
        bill_info_id: invoiceId,
        del_ind: 1, // Only non-deleted records
      },
    });

    if (!invoiceInfo) {
      return new Response(
        JSON.stringify({ error: "Invoice record not found" }),
        {
          status: 404,
        }
      );
    }

    // Fetch the customer information
    const customer = await prisma.hps_customer.findUnique({
      where: {
        customer_id: invoiceInfo.customer_name,
      },
      select: {
        customer_id: true,
        customer_full_name: true,
        customer_address: true,
        customer_mobile: true,
      },
    });

    // Fetch all invoice items for this invoice
    const invoiceItems = await prisma.hps_bill_item.findMany({
      where: {
        bill_info_id: invoiceId,
        del_ind: 1, // Only non-deleted records
      },
      orderBy: {
        bill_item_id: "asc",
      },
    });

    // Fetch bag types for all invoice items
    const bagTypes = await prisma.hps_bag_type.findMany({
      where: {
        bag_id: {
          in: invoiceItems.map((item) => item.bundel_type),
        },
      },
      select: {
        bag_id: true,
        bag_type: true,
      },
    });

    // Create a map of bag_id to bag_type for easy lookups
    const bagTypeMap = new Map(
      bagTypes.map((bag) => [bag.bag_id, bag.bag_type])
    );

    // Enhance invoice items with bag type information
    const enhancedInvoiceItems = invoiceItems.map((item) => ({
      ...item,
      bag_type: bagTypeMap.get(item.bundel_type) || "Unknown",
    }));

    // Calculate total amount
    const totalAmount = enhancedInvoiceItems.reduce((sum, item) => {
      return sum + parseFloat(item.item_total || "0");
    }, 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          invoiceInfo,
          customer,
          invoiceItems: enhancedInvoiceItems,
          totalAmount: totalAmount.toFixed(2),
        },
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch invoice details" }),
      {
        status: 500,
      }
    );
  }
}

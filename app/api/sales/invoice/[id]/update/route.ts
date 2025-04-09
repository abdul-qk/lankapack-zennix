import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = parseInt(params.id);
    const body = await req.json();

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid invoice ID format" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.customerId || !body.doId || !body.doNumber || !body.items || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: customerId, doId, doNumber, or items",
        },
        { status: 400 }
      );
    }

    // Calculate total from items
    const total = body.items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.total || "0"),
      0
    );

    // Check if invoice exists
    const existingInvoice = await prisma.hps_bill_info.findUnique({
      where: {
        bill_info_id: invoiceId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Update invoice info - use the doId (which is now the sales_info_id) as the bill_do field
    const updatedInvoice = await prisma.hps_bill_info.update({
      where: {
        bill_info_id: invoiceId,
      },
      data: {
        customer_name: parseInt(body.customerId),
        bill_do: body.doId.toString(), // Use the DO ID (sales_info_id) as the bill_do
        bill_total: total.toFixed(2),
        user_id: body.userId || 1, // Default to 1 if not provided
      },
    });

    // Delete existing invoice items
    await prisma.hps_bill_item.deleteMany({
      where: {
        bill_info_id: invoiceId,
      },
    });

    // Create new invoice items
    const invoiceItemPromises = body.items.map((item: any, index: number) =>
      prisma.hps_bill_item.create({
        data: {
          bill_info_id: invoiceId,
          de_number: parseInt(body.items[index].doNumber), // Use the DO ID from the form
          bundel_type: item.bagTypeId, // Use the bag type ID directly from hps_bag_type
          bundel_qty: item.quantity.toString(),
          item_price: item.price,
          item_total: item.total,
          user_id: body.userId || 1, // Default to 1 if not provided
          del_ind: 1, // Not deleted
        },
      })
    );

    const invoiceItems = await Promise.all(invoiceItemPromises);

    return NextResponse.json(
      {
        success: true,
        message: "Invoice updated successfully",
        data: {
          invoiceId: invoiceId,
          invoiceInfo: updatedInvoice,
          invoiceItems,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

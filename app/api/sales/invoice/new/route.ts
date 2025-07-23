import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.customerId || !body.doId || !body.doNumber || !body.items || body.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: customerId, doId, doNumber, or items",
      }, { status: 400 });
    }

    // Calculate total from items
    const total = body.items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.total || "0"),
      0
    );

    // Get customer information
    const customer = await prisma.hps_customer.findUnique({
      where: { customer_id: parseInt(body.customerId) },
      select: {
        customer_full_name: true,
        customer_address: true,
        customer_mobile: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ 
        success: false, 
        error: "Customer not found" 
      }, { status: 404 });
    }

    // Create invoice record
    const invoiceInfo = await prisma.hps_bill_info.create({
      data: {
        customer_name: parseInt(body.customerId),
        bill_do: body.doId.toString(), // Use the DO ID (sales_info_id) as the bill_do
        bill_total: total.toFixed(2),
        add_date: new Date(),
        user_id: body.userId || 1, // Default to 1 if not provided
        del_ind: 1, // Not deleted
      },
    });

    // Create invoice items
    const invoiceItemPromises = body.items.map((item: any, index: number) =>
      prisma.hps_bill_item.create({
        data: {
          bill_info_id: invoiceInfo.bill_info_id,
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

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully",
      data: {
        invoiceId: invoiceInfo.bill_info_id,
        invoiceInfo,
        invoiceItems,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create invoice" 
    }, { status: 500 });
  }
}

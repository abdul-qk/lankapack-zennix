import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all active customers
    const customers = await prisma.hps_customer.findMany({
      where: {
        del_ind: 1, // Not deleted
      },
      select: {
        customer_id: true,
        customer_full_name: true,
        customer_address: true,
        customer_mobile: true,
      },
      orderBy: {
        customer_full_name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

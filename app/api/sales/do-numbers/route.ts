export const dynamic = "force-dynamic";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all sales info records that are not deleted
    const salesInfoRecords = await prisma.hps_sales_info.findMany({
      where: {
        del_ind: 1, // Not deleted
      },
      select: {
        sales_info_id: true,
        sales_no_bags: true,
        customer_name: true,
      },
      orderBy: {
        sales_info_id: "desc",
      },
    });

    // Get customer names for each sales record
    const salesWithCustomerNames = await Promise.all(
      salesInfoRecords.map(async (record) => {
        const customer = await prisma.hps_customer.findUnique({
          where: {
            customer_id: record.customer_name,
          },
          select: {
            customer_full_name: true,
          },
        });

        return {
          id: record.sales_info_id,
          doNumber: record.sales_no_bags,
          customerId: record.customer_name,
          customerName: customer?.customer_full_name || "Unknown Customer",
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: salesWithCustomerNames,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching DO numbers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch DO numbers" },
      { status: 500 }
    );
  }
}

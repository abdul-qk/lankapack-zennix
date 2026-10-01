import { prisma } from "@/lib/prisma";
import { resolveItemKind } from "@/lib/sales/resolveBundlePrice";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const salesItemId = parseInt(params.id);

        if (isNaN(salesItemId)) {
            return new Response(JSON.stringify({ error: "Invalid ID format" }), {
                status: 400,
            });
        }

        // Fetch the sales info
        const salesInfo = await prisma.hps_sales_info.findUnique({
            where: {
                sales_info_id: salesItemId,
            },
        });

        if (!salesInfo) {
            return new Response(JSON.stringify({ error: "Sales record not found" }), {
                status: 404,
            });
        }

        // Fetch the customer information
        const customer = await prisma.hps_customer.findUnique({
            where: {
                customer_id: salesInfo.customer_name,
            },
            select: {
                customer_id: true,
                customer_full_name: true,
                customer_address: true,
                customer_mobile: true,
            },
        });

        // Fetch all sales items for this sales
        const salesItems = await prisma.hps_sales_item.findMany({
            where: {
                sales_info_id: salesItemId,
            },
            orderBy: {
                bundle_type: "asc",
            },
        });

        const bundleTypes = Array.from(
            new Set(salesItems.map((item) => item.bundle_type).filter(Boolean))
        );

        const [bagTypes, sheetTypes] = await Promise.all([
            bundleTypes.length
                ? prisma.hps_bag_type.findMany({
                      where: { bag_type: { in: bundleTypes } },
                      select: { bag_type: true },
                  })
                : Promise.resolve([]),
            bundleTypes.length
                ? prisma.hps_sheet_type.findMany({
                      where: { sheet_type: { in: bundleTypes } },
                      select: { sheet_type: true },
                  })
                : Promise.resolve([]),
        ]);

        const bagTypeSet = new Set(bagTypes.map((bt) => bt.bag_type));
        const sheetTypeSet = new Set(sheetTypes.map((st) => st.sheet_type));

        const salesItemsWithKind = salesItems.map((item) => ({
            ...item,
            item_kind: resolveItemKind(
                bagTypeSet.has(item.bundle_type),
                sheetTypeSet.has(item.bundle_type)
            ),
        }));

        // Calculate total amount
        const totalAmount = salesItems.reduce((sum, item) => {
            return sum + parseFloat(item.item_total || "0");
        }, 0);

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    salesInfo,
                    customer,
                    salesItems: salesItemsWithKind,
                    totalAmount: totalAmount.toFixed(2),
                },
            }),
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error("Error fetching sales details:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch sales details" }),
            {
                status: 500,
            }
        );
    }
}
